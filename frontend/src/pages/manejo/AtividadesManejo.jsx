import { Alert, Breadcrumb, Button, Flex, Input, Select, Space, Table, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarAtividadesManejo } from '../../api/atividadesManejoApi.js';
import { listarSafras } from '../../api/safrasApi.js';
import { listarTiposManejo } from '../../api/tiposManejoApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoVer } from '../../components/Botoes.jsx';
import { AtividadeManejoFormModal } from './AtividadeManejoFormModal.jsx';
import { TiposManejoModal } from './TiposManejoModal.jsx';
import { StatusAtividadeTag } from './StatusAtividadeTag.jsx';
import { OPCOES_STATUS_ATIVIDADE, rotuloSafra } from './opcoesAtividade.js';

const TODOS = 'todos';

export function AtividadesManejo() {
  const navigate = useNavigate();

  const [atividades, setAtividades] = useState([]);
  const [safras, setSafras] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [versaoTipos, setVersaoTipos] = useState(0);

  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroSafra, setFiltroSafra] = useState(TODOS);
  const [filtroTipo, setFiltroTipo] = useState(TODOS);
  const [filtroStatus, setFiltroStatus] = useState(TODOS);

  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);
  const [tiposAberto, setTiposAberto] = useState(false);

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

    listarTiposManejo()
      .then((dados) => {
        if (!ignorar) setTipos(dados);
      })
      .catch(() => {});

    return () => {
      ignorar = true;
    };
  }, [versaoTipos]);

  useEffect(() => {
    let ignorar = false;

    listarAtividadesManejo({
      pesquisa: filtroPesquisa,
      safraId: filtroSafra === TODOS ? undefined : filtroSafra,
      tipoManejoId: filtroTipo === TODOS ? undefined : filtroTipo,
      status: filtroStatus === TODOS ? undefined : filtroStatus,
    })
      .then((dados) => {
        if (!ignorar) {
          setAtividades(dados);
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
  }, [filtroPesquisa, filtroSafra, filtroTipo, filtroStatus, versao]);

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

  function aposAlterarTipos() {
    setVersaoTipos((v) => v + 1);
    recarregar();
  }

  const opcoesSafra = [{ value: TODOS, label: 'Todas' }, ...safras.map((s) => ({ value: s.id, label: rotuloSafra(s) }))];
  const opcoesTipo = [{ value: TODOS, label: 'Todos' }, ...tipos.map((t) => ({ value: t.id, label: t.nome }))];
  const opcoesStatus = [{ value: TODOS, label: 'Todos' }, ...OPCOES_STATUS_ATIVIDADE];

  const colunas = [
    {
      title: 'Data planejada',
      dataIndex: 'dataPlanejada',
      key: 'dataPlanejada',
      render: formatarData,
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (descricao, registro) => <Link to={`/atividades-manejo/${registro.id}`}>{descricao}</Link>,
    },
    {
      title: 'Tipo',
      dataIndex: 'nomeTipoManejo',
      key: 'nomeTipoManejo',
    },
    {
      title: 'Safra',
      key: 'safra',
      render: (_, registro) => `${registro.anoAgricolaSafra} · ${registro.nomePropriedade}`,
    },
    {
      title: 'Talhões',
      dataIndex: 'talhoes',
      key: 'talhoes',
      render: (talhoes) => talhoes.map((t) => t.nome).join(', '),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusAtividadeTag status={status} />,
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoVer onClick={() => navigate(`/atividades-manejo/${registro.id}`)} />
          {registro.status !== 'Cancelada' && <BotaoEditar onClick={() => abrirEdicao(registro)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Planejamento' }, { title: 'Atividades de Manejo' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Atividades de Manejo
          </Typography.Title>
          <Typography.Text type="secondary">Atividades agendadas e realizadas nos talhões de cada safra</Typography.Text>
        </div>
        <Flex gap={8} wrap>
          <Button icon={<SettingOutlined />} onClick={() => setTiposAberto(true)}>
            Tipos de manejo
          </Button>
          <BotaoNovo onClick={abrirCadastro} />
        </Flex>
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por descrição"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 260, maxWidth: '100%' }}
        />
        <Flex align="center" gap={8}>
          <Typography.Text>Safra:</Typography.Text>
          <Select value={filtroSafra} onChange={filtrarPor(setFiltroSafra)} options={opcoesSafra} style={{ width: 230 }} />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Tipo:</Typography.Text>
          <Select value={filtroTipo} onChange={filtrarPor(setFiltroTipo)} options={opcoesTipo} style={{ width: 170 }} />
        </Flex>
        <Flex align="center" gap={8}>
          <Typography.Text>Status:</Typography.Text>
          <Select value={filtroStatus} onChange={filtrarPor(setFiltroStatus)} options={opcoesStatus} style={{ width: 150 }} />
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
        dataSource={atividades}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma atividade de manejo encontrada.' }}
      />

      <AtividadeManejoFormModal
        aberto={modalAberto}
        atividade={emEdicao}
        safras={safras}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />

      <TiposManejoModal aberto={tiposAberto} aoFechar={() => setTiposAberto(false)} aoAlterar={aposAlterarTipos} />
    </div>
  );
}
