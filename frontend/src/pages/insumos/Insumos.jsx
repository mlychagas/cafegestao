import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { inativarInsumo, listarInsumos, reativarInsumo } from '../../api/insumosApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarQuantidade, textoOuTraco } from '../../utils/formatadores.js';
import { OPCOES_CATEGORIA, siglaUnidade } from '../../utils/opcoesInsumo.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao } from '../../components/Botoes.jsx';
import { InsumoFormModal } from './InsumoFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_INSUMO, CONSEQUENCIA_REATIVAR_INSUMO } from './textosInsumo.js';

const OPCOES_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
];

const FILTRO_ATIVO = {
  todos: undefined,
  ativos: true,
  inativos: false,
};

const OPCOES_FILTRO_CATEGORIA = [{ value: 'todas', label: 'Todas' }, ...OPCOES_CATEGORIA];

export function Insumos() {
  const { message } = App.useApp();

  const [insumos, setInsumos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarInsumos({
      nome: filtroNome,
      categoria: filtroCategoria === 'todas' ? undefined : filtroCategoria,
      ativo: FILTRO_ATIVO[filtroStatus],
    })
      .then((dados) => {
        if (!ignorar) {
          setInsumos(dados);
          setErroLista(null);
        }
      })
      .catch((erro) => {
        if (!ignorar) setErroLista(tratarErroApi(erro));
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });

    return () => {
      ignorar = true;
    };
  }, [filtroNome, filtroCategoria, filtroStatus, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aoPesquisar(valor) {
    const nome = valor.trim();
    if (nome === filtroNome) return;
    setCarregando(true);
    setFiltroNome(nome);
  }

  function aoMudarCategoria(valor) {
    setCarregando(true);
    setFiltroCategoria(valor);
  }

  function aoMudarStatus(valor) {
    setCarregando(true);
    setFiltroStatus(valor);
  }

  function abrirCadastro() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(registro) {
    setEmEdicao(registro);
    setModalAberto(true);
  }

  function aposSalvar() {
    setModalAberto(false);
    recarregar();
  }

  async function alterarSituacao(registro) {
    try {
      if (registro.ativo) {
        await inativarInsumo(registro.id);
        message.success('Insumo inativado.');
      } else {
        await reativarInsumo(registro.id);
        message.success('Insumo reativado.');
      }
      recarregar();
    } catch (erro) {
      message.error(tratarErroApi(erro));
    }
  }

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Categoria',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria) => <Tag>{categoria}</Tag>,
    },
    {
      title: 'Estoque',
      dataIndex: 'quantidadeEstoque',
      key: 'quantidadeEstoque',
      render: (quantidade, registro) => formatarQuantidade(quantidade, siglaUnidade(registro.unidadeMedida)),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
      render: textoOuTraco,
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo) => (ativo ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>),
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
          <BotaoSituacao
            ativo={registro.ativo}
            nomeItem="este insumo"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_INSUMO}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_INSUMO}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Suprimentos' }, { title: 'Insumos' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Insumos
          </Typography.Title>
          <Typography.Text type="secondary">Adubos, defensivos e corretivos com o estoque disponível</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por nome"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 280, maxWidth: '100%' }}
        />
        <Flex align="center" gap={8}>
          <Typography.Text>Categoria:</Typography.Text>
          <Select
            value={filtroCategoria}
            onChange={aoMudarCategoria}
            options={OPCOES_FILTRO_CATEGORIA}
            style={{ width: 150 }}
          />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Status:</Typography.Text>
          <Select value={filtroStatus} onChange={aoMudarStatus} options={OPCOES_STATUS} style={{ width: 130 }} />
        </Flex>
      </Flex>

      {erroLista && (
        <Alert
          type="error"
          showIcon
          title={erroLista}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={recarregar}>
              Tentar novamente
            </Button>
          }
        />
      )}

      <Table
        rowKey="id"
        columns={colunas}
        dataSource={insumos}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhum insumo encontrado.' }}
      />

      <InsumoFormModal
        aberto={modalAberto}
        insumo={emEdicao}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
