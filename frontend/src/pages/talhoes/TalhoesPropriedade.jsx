import { Alert, App, Button, Card, Flex, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { inativarTalhao, listarTalhoes, reativarTalhao } from '../../api/talhoesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarArea, formatarData, formatarEspacamento, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao } from '../../components/Botoes.jsx';
import { TalhaoFormModal } from './TalhaoFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_TALHAO, CONSEQUENCIA_REATIVAR_TALHAO } from './textosTalhao.js';

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

function arredondar(valor) {
  return Math.round(valor * 1000) / 1000;
}

export function TalhoesPropriedade({ propriedade, aoAlterar }) {
  const { message } = App.useApp();

  const [talhoes, setTalhoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  const propriedadeId = propriedade.id;

  useEffect(() => {
    let ignorar = false;

    listarTalhoes({ propriedadeId, nome: filtroNome, ativo: FILTRO_ATIVO[filtroStatus] })
      .then((dados) => {
        if (!ignorar) {
          setTalhoes(dados);
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
  }, [propriedadeId, filtroNome, filtroStatus, versao]);

  const areaLivreHa = arredondar(Math.max(propriedade.areaCultivadaHa - propriedade.areaTalhoesHa, 0));

  const areaDisponivelModal =
    emEdicao && emEdicao.ativo ? arredondar(areaLivreHa + emEdicao.areaHa) : areaLivreHa;

  const motivoBloqueio = !propriedade.ativo
    ? 'Reative a propriedade para cadastrar talhões.'
    : areaLivreHa <= 0
      ? 'Não há área cultivada disponível. Aumente a área cultivada da propriedade ou inative um talhão.'
      : null;

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
    aoAlterar();
  }

  async function alterarSituacao(registro) {
    try {
      if (registro.ativo) {
        await inativarTalhao(registro.id);
        message.success('Talhão inativado.');
      } else {
        await reativarTalhao(registro.id);
        message.success('Talhão reativado.');
      }
      recarregar();
      aoAlterar();
    } catch (erro) {
      message.error(tratarErroApi(erro));
    }
  }

  const colunas = [
    {
      title: 'Identificação',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Área',
      dataIndex: 'areaHa',
      key: 'areaHa',
      render: formatarArea,
    },
    {
      title: 'Variedades',
      dataIndex: 'variedades',
      key: 'variedades',
      render: textoOuTraco,
    },
    {
      title: 'Espaçamento',
      key: 'espacamento',
      render: (_, registro) => formatarEspacamento(registro.espacamentoLinha, registro.espacamentoPlanta),
    },
    {
      title: 'Plantio',
      dataIndex: 'dataPlantio',
      key: 'dataPlantio',
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
            nomeItem="este talhão"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_TALHAO}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_TALHAO}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  const botaoNovo = motivoBloqueio ? (
    <Tooltip title={motivoBloqueio}>
      <span>
        <BotaoNovo desabilitado />
      </span>
    </Tooltip>
  ) : (
    <BotaoNovo onClick={abrirCadastro} />
  );

  return (
    <Card title="Talhões" extra={botaoNovo}>
      <Typography.Paragraph type="secondary">
        Subdivisões da propriedade rural utilizadas no planejamento de safras.
      </Typography.Paragraph>

      <Flex wrap gap={16} style={{ marginBottom: 16 }}>
        <Typography.Text>
          Área cultivada: <strong>{formatarArea(propriedade.areaCultivadaHa)}</strong>
        </Typography.Text>
        <Typography.Text>
          Em talhões ativos: <strong>{formatarArea(propriedade.areaTalhoesHa)}</strong>
        </Typography.Text>
        <Typography.Text>
          Disponível: <strong>{formatarArea(areaLivreHa)}</strong>
        </Typography.Text>
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por identificação"
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
        dataSource={talhoes}
        loading={carregando}
        scroll={{ x: 'max-content' }}
        pagination={{ hideOnSinglePage: true }}
        locale={{ emptyText: 'Nenhum talhão encontrado nesta propriedade.' }}
      />

      <TalhaoFormModal
        aberto={modalAberto}
        propriedadeId={propriedadeId}
        talhao={emEdicao}
        areaDisponivelHa={areaDisponivelModal}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Card>
  );
}