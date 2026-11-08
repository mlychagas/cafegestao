import { Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obterCompra } from '../../api/comprasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarMoeda, formatarQuantidade } from '../../utils/formatadores.js';
import { siglaUnidade } from '../../utils/opcoesInsumo.js';
import { tipoDocumento } from '../../utils/documentos.js';
import { BotaoEditar, BotaoVoltar } from '../../components/Botoes.jsx';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function CompraDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compra, setCompra] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ignorar = false;

    obterCompra(id)
      .then((dados) => {
        if (!ignorar) {
          setCompra(dados);
          setErro(null);
        }
      })
      .catch((e) => {
        if (!ignorar) setErro({ status: e.response?.status, mensagem: tratarErroApi(e) });
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });

    return () => {
      ignorar = true;
    };
  }, [id, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  if (carregando && !compra) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !compra) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Compra não encontrada' : 'Não foi possível carregar a compra'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/compras')}>Voltar para a lista</Button>
            {erro.status !== 404 && (
              <Button type="primary" onClick={recarregar}>
                Tentar novamente
              </Button>
            )}
          </Flex>
        }
      />
    );
  }

  const itensDados = [
    { key: 'notaFiscal', label: 'Nota fiscal', children: compra.notaFiscal },
    { key: 'data', label: 'Data da compra', children: formatarData(compra.dataCompra) },
    {
      key: 'fornecedor',
      label: 'Fornecedor',
      children: <Link to={`/fornecedores/${compra.fornecedorId}`}>{compra.nomeFornecedor}</Link>,
    },
    {
      key: 'documento',
      label: tipoDocumento(compra.cpfCnpjFornecedor),
      children: compra.cpfCnpjFornecedor,
    },
    { key: 'cadastro', label: 'Cadastrada em', children: formatarData(compra.dataCriacao) },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(compra.dataAtualizacao) },
  ];

  const colunasItens = [
    {
      title: 'Insumo',
      dataIndex: 'nomeInsumo',
      key: 'nomeInsumo',
      render: (nome, item) => (
        <Flex gap={8} align="center">
          {nome}
          {!item.insumoAtivo && <Tag>Inativo</Tag>}
        </Flex>
      ),
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      render: (quantidade, item) => formatarQuantidade(quantidade, siglaUnidade(item.unidadeMedida)),
    },
    {
      title: 'Valor unitário',
      dataIndex: 'valorUnitario',
      key: 'valorUnitario',
      render: formatarMoeda,
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: formatarMoeda,
    },
  ];

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/compras')}>Voltar para Compras</BotaoVoltar>

      <Breadcrumb
        items={[
          { title: 'Suprimentos' },
          { title: <Link to="/compras">Compras</Link> },
          { title: `NF ${compra.notaFiscal}` },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Compra NF {compra.notaFiscal}
          </Typography.Title>
          <Typography.Text type="secondary">
            {compra.nomeFornecedor} · {formatarData(compra.dataCompra)}
          </Typography.Text>
        </div>

        <BotaoEditar naTabela={false} onClick={() => navigate(`/compras/${compra.id}/editar`)} />
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados da compra">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title="Itens da compra">
          <Table
            rowKey="insumoId"
            columns={colunasItens}
            dataSource={compra.itens}
            pagination={false}
            scroll={{ x: 'max-content' }}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>Valor total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{formatarMoeda(compra.valorTotal)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      </Flex>
    </Spin>
  );
}
