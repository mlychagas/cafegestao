import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inativarPropriedade, listarPropriedades, reativarPropriedade } from '../../api/propriedadesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarArea, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao, BotaoVer } from '../../components/Botoes.jsx';
import { PropriedadeFormModal } from './PropriedadeFormModal.jsx';
import { CONSEQUENCIA_INATIVAR, CONSEQUENCIA_REATIVAR } from './textosPropriedade.js';

const OPCOES_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativas' },
  { value: 'inativos', label: 'Inativas' },
];

const FILTRO_ATIVO = {
  todos: undefined,
  ativos: true,
  inativos: false,
};

export function Propriedades() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [propriedades, setPropriedades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarPropriedades({ nome: filtroNome, ativo: FILTRO_ATIVO[filtroStatus] })
      .then((dados) => {
        if (!ignorar) {
          setPropriedades(dados);
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
  }, [filtroNome, filtroStatus, versao]);

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
        await inativarPropriedade(registro.id);
        message.success('Propriedade inativada.');
      } else {
        await reativarPropriedade(registro.id);
        message.success('Propriedade reativada.');
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
      render: (nome, registro) => <Link to={`/propriedades/${registro.id}`}>{nome}</Link>,
    },
    {
      title: 'Proprietário',
      dataIndex: 'nomeProprietario',
      key: 'nomeProprietario',
      render: textoOuTraco,
    },
    {
      title: 'Área total',
      dataIndex: 'areaTotalHa',
      key: 'areaTotalHa',
      render: formatarArea,
    },
    {
      title: 'Área cultivada',
      dataIndex: 'areaCultivadaHa',
      key: 'areaCultivadaHa',
      render: formatarArea,
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo) => (ativo ? <Tag color="green">Ativa</Tag> : <Tag>Inativa</Tag>),
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoVer onClick={() => navigate(`/propriedades/${registro.id}`)} />
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
          <BotaoSituacao
            ativo={registro.ativo}
            nomeItem="esta propriedade"
            consequenciaInativar={CONSEQUENCIA_INATIVAR}
            consequenciaReativar={CONSEQUENCIA_REATIVAR}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Planejamento' }, { title: 'Propriedades Rurais' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Propriedades Rurais
          </Typography.Title>
          <Typography.Text type="secondary">Propriedades cadastradas pelo usuário</Typography.Text>
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
        dataSource={propriedades}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma propriedade encontrada.' }}
      />

      <PropriedadeFormModal
        aberto={modalAberto}
        propriedade={emEdicao}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}