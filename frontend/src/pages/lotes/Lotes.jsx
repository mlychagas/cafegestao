import { Alert, App, Breadcrumb, Button, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inativarLoteCafe, listarLotesCafe, reativarLoteCafe } from '../../api/lotesCafeApi.js';
import { listarSafras } from '../../api/safrasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarQuantidade } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao, BotaoVer } from '../../components/Botoes.jsx';
import { rotuloSafra } from '../manejo/opcoesAtividade.js';
import { siglaUnidadeColheita } from '../colheitas/opcoesColheita.js';
import { LoteFormModal } from './LoteFormModal.jsx';
import {
  CONSEQUENCIA_INATIVAR_LOTE,
  CONSEQUENCIA_REATIVAR_LOTE,
  OPCOES_PROCESSAMENTO,
  rotuloProcessamento,
} from './opcoesLote.js';

const TODAS = 'todas';

const OPCOES_STATUS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
];

const FILTRO_ATIVO = { todos: undefined, ativos: true, inativos: false };

export function Lotes() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [lotes, setLotes] = useState([]);
  const [safras, setSafras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroSafra, setFiltroSafra] = useState(TODAS);
  const [filtroProcessamento, setFiltroProcessamento] = useState(TODAS);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarSafras()
      .then((dados) => {
        if (!ignorar) setSafras(dados);
      })
      .catch(() => {});

    return () => {
      ignorar = true;
    };
  }, []);

  useEffect(() => {
    let ignorar = false;

    listarLotesCafe({
      pesquisa: filtroPesquisa,
      safraId: filtroSafra === TODAS ? undefined : filtroSafra,
      formaProcessamento: filtroProcessamento === TODAS ? undefined : filtroProcessamento,
      ativo: FILTRO_ATIVO[filtroStatus],
    })
      .then((dados) => {
        if (!ignorar) {
          setLotes(dados);
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
  }, [filtroPesquisa, filtroSafra, filtroProcessamento, filtroStatus, versao]);

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

  function filtrarPor(definir) {
    return (valor) => {
      setCarregando(true);
      definir(valor);
    };
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
        await inativarLoteCafe(registro.id);
        message.success('Lote inativado.');
      } else {
        await reativarLoteCafe(registro.id);
        message.success('Lote reativado.');
      }
      recarregar();
    } catch (erro) {
      message.error(tratarErroApi(erro));
    }
  }

  const opcoesSafra = [{ value: TODAS, label: 'Todas' }, ...safras.map((s) => ({ value: s.id, label: rotuloSafra(s) }))];
  const opcoesProcessamento = [
    { value: TODAS, label: 'Todos' },
    ...OPCOES_PROCESSAMENTO.map((o) => ({ value: o.value, label: rotuloProcessamento(o.value) })),
  ];

  const colunas = [
    {
      title: 'Lote',
      dataIndex: 'nome',
      key: 'nome',
      render: (nome, registro) => <Link to={`/lotes/${registro.id}`}>{nome}</Link>,
    },
    {
      title: 'Safra',
      key: 'safra',
      render: (_, registro) => `${registro.anoAgricolaSafra} · ${registro.nomePropriedade}`,
    },
    {
      title: 'Armazenamento',
      dataIndex: 'dataArmazenamento',
      key: 'dataArmazenamento',
      render: formatarData,
    },
    {
      title: 'Peso armazenado',
      key: 'quantidade',
      align: 'right',
      render: (_, registro) => formatarQuantidade(registro.quantidade, siglaUnidadeColheita(registro.unidadeMedida)),
    },
    {
      title: 'Processamento',
      dataIndex: 'formaProcessamento',
      key: 'formaProcessamento',
      render: rotuloProcessamento,
    },
    {
      title: 'Umidade',
      dataIndex: 'umidade',
      key: 'umidade',
      align: 'right',
      render: (umidade) => (umidade === null || umidade === undefined ? '—' : `${formatarQuantidade(umidade)}%`),
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
          <BotaoVer onClick={() => navigate(`/lotes/${registro.id}`)} />
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
          <BotaoSituacao
            ativo={registro.ativo}
            nomeItem="este lote"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_LOTE}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_LOTE}
            onConfirmar={() => alterarSituacao(registro)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Produção' }, { title: 'Lotes de café' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Lotes de café
          </Typography.Title>
          <Typography.Text type="secondary">Café armazenado de cada safra, depois da secagem e do beneficiamento</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por nome"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 240, maxWidth: '100%' }}
        />
        <Flex align="center" gap={8}>
          <Typography.Text>Safra:</Typography.Text>
          <Select value={filtroSafra} onChange={filtrarPor(setFiltroSafra)} options={opcoesSafra} style={{ width: 240 }} />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Processamento:</Typography.Text>
          <Select
            value={filtroProcessamento}
            onChange={filtrarPor(setFiltroProcessamento)}
            options={opcoesProcessamento}
            style={{ width: 150 }}
          />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Status:</Typography.Text>
          <Select value={filtroStatus} onChange={filtrarPor(setFiltroStatus)} options={OPCOES_STATUS} style={{ width: 130 }} />
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
        dataSource={lotes}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhum lote de café encontrado.' }}
      />

      <LoteFormModal
        aberto={modalAberto}
        lote={emEdicao}
        safras={safras}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
