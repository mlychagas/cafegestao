import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inativarFornecedor, listarFornecedores, reativarFornecedor } from '../../api/fornecedoresApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao, BotaoVer } from '../../components/Botoes.jsx';
import { FornecedorFormModal } from './FornecedorFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_FORNECEDOR, CONSEQUENCIA_REATIVAR_FORNECEDOR } from './textosFornecedor.js';

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

export function Fornecedores() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarFornecedores({ pesquisa: filtroPesquisa, ativo: FILTRO_ATIVO[filtroStatus] })
      .then((dados) => {
        if (!ignorar) {
          setFornecedores(dados);
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
  }, [filtroPesquisa, filtroStatus, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aoPesquisar(valor) {
    const pesquisa = valor.trim();
    if (pesquisa === filtroPesquisa) return;
    setCarregando(true);
    setFiltroPesquisa(pesquisa);
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
        await inativarFornecedor(registro.id);
        message.success('Fornecedor inativado.');
      } else {
        await reativarFornecedor(registro.id);
        message.success('Fornecedor reativado.');
      }
      recarregar();
    } catch (erro) {
      message.error(tratarErroApi(erro));
    }
  }

  const colunas = [
    {
      title: 'Razão social / nome',
      dataIndex: 'razaoSocial',
      key: 'razaoSocial',
      render: (razaoSocial, registro) => <Link to={`/fornecedores/${registro.id}`}>{razaoSocial}</Link>,
    },
    {
      title: 'CPF/CNPJ',
      dataIndex: 'cpfCnpj',
      key: 'cpfCnpj',
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
    },
    {
      title: 'Cidade',
      key: 'cidade',
      render: (_, registro) => `${registro.endereco.cidade} / ${registro.endereco.uf}`,
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
          <BotaoVer onClick={() => navigate(`/fornecedores/${registro.id}`)} />
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
          <BotaoSituacao
            ativo={registro.ativo}
            nomeItem="este fornecedor"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_FORNECEDOR}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_FORNECEDOR}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Suprimentos' }, { title: 'Fornecedores' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Fornecedores
          </Typography.Title>
          <Typography.Text type="secondary">Empresas e pessoas de quem são comprados os insumos</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por nome ou CPF/CNPJ"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 280, maxWidth: '100%' }}
        />
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
        dataSource={fornecedores}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhum fornecedor encontrado.' }}
      />

      <FornecedorFormModal
        aberto={modalAberto}
        fornecedor={emEdicao}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
