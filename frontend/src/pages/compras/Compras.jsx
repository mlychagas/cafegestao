import { Alert, Breadcrumb, Button, DatePicker, Flex, Input, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarCompras } from '../../api/comprasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarMoeda } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoVer } from '../../components/Botoes.jsx';

export function Compras() {
  const navigate = useNavigate();

  const [compras, setCompras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);

  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [periodo, setPeriodo] = useState(null);

  useEffect(() => {
    let ignorar = false;

    listarCompras({
      pesquisa: filtroPesquisa,
      dataInicio: periodo?.[0]?.format('YYYY-MM-DD'),
      dataFim: periodo?.[1]?.format('YYYY-MM-DD'),
    })
      .then((dados) => {
        if (!ignorar) {
          setCompras(dados);
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
  }, [filtroPesquisa, periodo, versao]);

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

  function aoMudarPeriodo(valor) {
    setCarregando(true);
    setPeriodo(valor);
  }

  const colunas = [
    {
      title: 'Data',
      dataIndex: 'dataCompra',
      key: 'dataCompra',
      render: formatarData,
    },
    {
      title: 'Nota fiscal',
      dataIndex: 'notaFiscal',
      key: 'notaFiscal',
      render: (notaFiscal, registro) => <Link to={`/compras/${registro.id}`}>{notaFiscal}</Link>,
    },
    {
      title: 'Fornecedor',
      dataIndex: 'nomeFornecedor',
      key: 'nomeFornecedor',
    },
    {
      title: 'Itens',
      dataIndex: 'quantidadeItens',
      key: 'quantidadeItens',
    },
    {
      title: 'Valor total',
      dataIndex: 'valorTotal',
      key: 'valorTotal',
      render: formatarMoeda,
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => (
        <Space size={0}>
          <BotaoVer onClick={() => navigate(`/compras/${registro.id}`)} />
          <BotaoEditar onClick={() => navigate(`/compras/${registro.id}/editar`)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: 'Suprimentos' }, { title: 'Compras' }]} style={{ marginBottom: 6 }} />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Compras
          </Typography.Title>
          <Typography.Text type="secondary">Compras de insumos registradas com seus fornecedores</Typography.Text>
        </div>
        <BotaoNovo onClick={() => navigate('/compras/nova')}>Nova compra</BotaoNovo>
      </Flex>

      <Flex wrap gap={12} align="center" style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Pesquisar por nota fiscal ou fornecedor"
          allowClear
          onSearch={aoPesquisar}
          style={{ width: 320, maxWidth: '100%' }}
        />
        <Flex align="center" gap={8}>
          <Typography.Text>Período:</Typography.Text>
          <DatePicker.RangePicker
            value={periodo}
            onChange={aoMudarPeriodo}
            format="DD/MM/YYYY"
            placeholder={['Data inicial', 'Data final']}
          />
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
        dataSource={compras}
        loading={carregando}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma compra encontrada.' }}
      />
    </div>
  );
}
