import { Alert, Breadcrumb, Button, Flex, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listarColheitas } from '../../api/colheitasApi.js';
import { listarSafras } from '../../api/safrasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarQuantidade, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoVer } from '../../components/Botoes.jsx';
import { rotuloSafra } from '../manejo/opcoesAtividade.js';
import { ColheitaFormModal } from './ColheitaFormModal.jsx';
import { siglaUnidadeColheita } from './opcoesColheita.js';

const TODAS = 'todas';

function formatarPeriodo(inicio, fim) {
  if (!fim || fim === inicio) return formatarData(inicio);
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

export function Colheitas() {
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const atividadeFiltrada = Number(parametros.get('atividadeId')) || undefined;

  const [colheitas, setColheitas] = useState([]);
  const [safras, setSafras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [filtroSafra, setFiltroSafra] = useState(TODAS);

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

    listarColheitas({ safraId: filtroSafra === TODAS ? undefined : filtroSafra, atividadeId: atividadeFiltrada })
      .then((dados) => {
        if (!ignorar) {
          setColheitas(dados);
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
  }, [filtroSafra, atividadeFiltrada, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aoMudarSafra(valor) {
    setCarregando(true);
    setFiltroSafra(valor);
  }

  function limparFiltroAtividade() {
    setCarregando(true);
    setParametros({}, { replace: true });
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

  const opcoesSafra = [{ value: TODAS, label: 'Todas' }, ...safras.map((s) => ({ value: s.id, label: rotuloSafra(s) }))];

  const colunas = [
    {
      title: 'Período',
      key: 'periodo',
      render: (_, registro) => (
        <Link to={`/colheitas/${registro.id}`}>{formatarPeriodo(registro.dataInicio, registro.dataFim)}</Link>
      ),
    },
    {
      title: 'Safra',
      key: 'safra',
      render: (_, registro) => `${registro.anoAgricolaSafra} · ${registro.nomePropriedade}`,
    },
    {
      title: 'Atividade',
      dataIndex: 'descricaoAtividade',
      key: 'descricaoAtividade',
      render: (descricao, registro) => (
        <Link to={`/atividades-manejo/${registro.atividadeManejoId}`}>{descricao}</Link>
      ),
    },
    {
      title: 'Talhões',
      dataIndex: 'talhoes',
      key: 'talhoes',
      render: (talhoes) => talhoes.map((t) => t.nome).join(', '),
    },
    {
      title: 'Quantidade',
      key: 'quantidade',
      align: 'right',
      render: (_, registro) => formatarQuantidade(registro.quantidade, siglaUnidadeColheita(registro.unidadeMedida)),
    },
    {
      title: 'Forma',
      dataIndex: 'formaColheita',
      key: 'formaColheita',
      render: textoOuTraco,
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoVer onClick={() => navigate(`/colheitas/${registro.id}`)} />
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Produção' }, { title: 'Colheitas' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Colheitas
          </Typography.Title>
          <Typography.Text type="secondary">Café colhido em cada safra, por atividade e talhão</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Flex align="center" gap={8}>
          <Typography.Text>Safra:</Typography.Text>
          <Select value={filtroSafra} onChange={aoMudarSafra} options={opcoesSafra} style={{ width: 260 }} />
        </Flex>
        {atividadeFiltrada && (
          <Tag closable onClose={limparFiltroAtividade} style={{ marginInlineEnd: 0, padding: '4px 10px' }}>
            Atividade: {colheitas[0]?.descricaoAtividade ?? 'selecionada'}
          </Tag>
        )}
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
        dataSource={colheitas}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma colheita encontrada.' }}
      />

      <ColheitaFormModal
        aberto={modalAberto}
        colheita={emEdicao}
        safras={safras}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
