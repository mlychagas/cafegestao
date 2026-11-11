import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { inativarPessoa, listarPessoas, reativarPessoa } from '../../api/pessoasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao } from '../../components/Botoes.jsx';
import { PessoaFormModal } from './PessoaFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_PESSOA, CONSEQUENCIA_REATIVAR_PESSOA } from './textosPessoa.js';

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

export function Pessoas() {
  const { message } = App.useApp();

  const [pessoas, setPessoas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarPessoas({ pesquisa: filtroPesquisa, ativo: FILTRO_ATIVO[filtroStatus] })
      .then((dados) => {
        if (!ignorar) {
          setPessoas(dados);
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
        await inativarPessoa(registro.id);
        message.success('Pessoa inativada.');
      } else {
        await reativarPessoa(registro.id);
        message.success('Pessoa reativada.');
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
      title: 'CPF',
      dataIndex: 'cpf',
      key: 'cpf',
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      render: textoOuTraco,
    },
    {
      title: 'Data de nascimento',
      dataIndex: 'dataNascimento',
      key: 'dataNascimento',
      render: formatarData,
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
            nomeItem="esta pessoa"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_PESSOA}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_PESSOA}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Planejamento' }, { title: 'Pessoas' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Pessoas
          </Typography.Title>
          <Typography.Text type="secondary">Trabalhadores que podem ser vinculados à mão de obra das atividades</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por nome ou CPF"
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
        dataSource={pessoas}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma pessoa encontrada.' }}
      />

      <PessoaFormModal
        aberto={modalAberto}
        pessoa={emEdicao}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
