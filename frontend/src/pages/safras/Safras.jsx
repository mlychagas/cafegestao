import { Alert, Breadcrumb, Button, Flex, Input, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarSafras } from '../../api/safrasApi.js';
import { listarPropriedades } from '../../api/propriedadesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarQuantidade } from '../../utils/formatadores.js';
import { OPCOES_STATUS_SAFRA, siglaProdutividade } from './opcoesSafra.js';
import { BotaoEditar, BotaoNovo, BotaoVer } from '../../components/Botoes.jsx';
import { SafraFormModal } from './SafraFormModal.jsx';
import { StatusSafraTag } from './StatusSafraTag.jsx';

const OPCOES_FILTRO_STATUS = [{ value: 'todos', label: 'Todos' }, ...OPCOES_STATUS_SAFRA];

export function Safras() {
  const navigate = useNavigate();

  const [safras, setSafras] = useState([]);
  const [propriedades, setPropriedades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroAno, setFiltroAno] = useState('');
  const [filtroPropriedade, setFiltroPropriedade] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarPropriedades()
      .then((dados) => {
        if (!ignorar) setPropriedades(dados);
      })
      .catch(() => {});

    return () => {
      ignorar = true;
    };
  }, []);

  useEffect(() => {
    let ignorar = false;

    listarSafras({
      anoAgricola: filtroAno,
      propriedadeId: filtroPropriedade === 'todas' ? undefined : filtroPropriedade,
      status: filtroStatus === 'todos' ? undefined : filtroStatus,
    })
      .then((dados) => {
        if (!ignorar) {
          setSafras(dados);
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
  }, [filtroAno, filtroPropriedade, filtroStatus, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aoPesquisar(valor) {
    const ano = valor.trim();
    if (ano === filtroAno) return;
    setCarregando(true);
    setFiltroAno(ano);
  }

  function aoMudarPropriedade(valor) {
    setCarregando(true);
    setFiltroPropriedade(valor);
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

  const opcoesFiltroPropriedade = [
    { value: 'todas', label: 'Todas' },
    ...propriedades.map((p) => ({ value: p.id, label: p.nome })),
  ];

  const colunas = [
    {
      title: 'Ano agrícola',
      dataIndex: 'anoAgricola',
      key: 'anoAgricola',
      render: (ano, registro) => <Link to={`/safras/${registro.id}`}>{ano}</Link>,
    },
    {
      title: 'Propriedade',
      dataIndex: 'nomePropriedade',
      key: 'nomePropriedade',
    },
    {
      title: 'Início',
      dataIndex: 'dataInicio',
      key: 'dataInicio',
      render: formatarData,
    },
    {
      title: 'Fechamento',
      dataIndex: 'dataFechamento',
      key: 'dataFechamento',
      render: formatarData,
    },
    {
      title: 'Produtividade estimada',
      dataIndex: 'produtividadeEstimada',
      key: 'produtividadeEstimada',
      render: (valor, registro) => formatarQuantidade(valor, siglaProdutividade(registro.unidadeMedida)),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusSafraTag status={status} />,
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoVer onClick={() => navigate(`/safras/${registro.id}`)} />
          <BotaoEditar onClick={() => abrirEdicao(registro)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Planejamento' }, { title: 'Safras' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Safras
          </Typography.Title>
          <Typography.Text type="secondary">Ciclos produtivos de cada propriedade rural</Typography.Text>
        </div>
        <BotaoNovo onClick={abrirCadastro} />
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por ano agrícola"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 280, maxWidth: '100%' }}
        />
        <Flex align="center" gap={8}>
          <Typography.Text>Propriedade:</Typography.Text>
          <Select
            value={filtroPropriedade}
            onChange={aoMudarPropriedade}
            options={opcoesFiltroPropriedade}
            style={{ width: 200 }}
          />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Status:</Typography.Text>
          <Select value={filtroStatus} onChange={aoMudarStatus} options={OPCOES_FILTRO_STATUS} style={{ width: 150 }} />
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
        dataSource={safras}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma safra encontrada.' }}
      />

      <SafraFormModal
        aberto={modalAberto}
        safra={emEdicao}
        propriedades={propriedades}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </div>
  );
}
