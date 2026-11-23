import { Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obterColheita } from '../../api/colheitasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarArea, formatarData, formatarQuantidade, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoVoltar } from '../../components/Botoes.jsx';
import { ColheitaFormModal } from './ColheitaFormModal.jsx';
import { siglaUnidadeColheita, UNIDADES_COLHEITA } from './opcoesColheita.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

const colunasTalhoes = [
  {
    title: 'Talhão',
    dataIndex: 'nome',
    key: 'nome',
    render: (nome, talhao) => (
      <Flex gap={8} align="center">
        {nome}
        {!talhao.ativo && <Tag>Inativo</Tag>}
      </Flex>
    ),
  },
  {
    title: 'Área',
    dataIndex: 'areaHa',
    key: 'areaHa',
    render: formatarArea,
  },
];

export function ColheitaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [colheita, setColheita] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterColheita(id)
      .then((dados) => {
        if (!ignorar) {
          setColheita(dados);
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

  function aposSalvar() {
    setModalAberto(false);
    recarregar();
  }

  if (carregando && !colheita) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !colheita) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Colheita não encontrada' : 'Não foi possível carregar a colheita'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/colheitas')}>Voltar para a lista</Button>
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

  const sigla = siglaUnidadeColheita(colheita.unidadeMedida);
  const areaColhida = colheita.talhoes.reduce((soma, t) => soma + t.areaHa, 0);

  const itensDados = [
    {
      key: 'safra',
      label: 'Safra',
      children: <Link to={`/safras/${colheita.safraId}`}>{colheita.anoAgricolaSafra}</Link>,
    },
    {
      key: 'propriedade',
      label: 'Propriedade rural',
      children: <Link to={`/propriedades/${colheita.propriedadeRuralId}`}>{colheita.nomePropriedade}</Link>,
    },
    {
      key: 'atividade',
      label: 'Atividade de manejo',
      children: <Link to={`/atividades-manejo/${colheita.atividadeManejoId}`}>{colheita.descricaoAtividade}</Link>,
    },
    { key: 'inicio', label: 'Data de início', children: formatarData(colheita.dataInicio) },
    { key: 'fim', label: 'Data de fim', children: formatarData(colheita.dataFim) },
    { key: 'quantidade', label: 'Quantidade colhida', children: formatarQuantidade(colheita.quantidade, sigla) },
    { key: 'unidade', label: 'Unidade de medida', children: UNIDADES_COLHEITA[colheita.unidadeMedida]?.rotulo },
    { key: 'forma', label: 'Forma de colheita', children: textoOuTraco(colheita.formaColheita) },
    { key: 'area', label: 'Área colhida', children: formatarArea(areaColhida) },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(colheita.dataAtualizacao) },
    { key: 'observacao', label: 'Observação', children: textoOuTraco(colheita.observacao), span: 'filled' },
  ];

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/colheitas')}>Voltar para Colheitas</BotaoVoltar>

      <Breadcrumb
        items={[
          { title: 'Produção' },
          { title: <Link to="/colheitas">Colheitas</Link> },
          { title: formatarData(colheita.dataInicio) },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Colheita de {formatarData(colheita.dataInicio)}
          </Typography.Title>
          <Typography.Text type="secondary">
            {colheita.descricaoAtividade} · Safra {colheita.anoAgricolaSafra}
          </Typography.Text>
        </div>
        <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados da colheita">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title="Talhões colhidos">
          <Table rowKey="id" size="small" columns={colunasTalhoes} dataSource={colheita.talhoes} pagination={false} />
        </Card>
      </Flex>

      <ColheitaFormModal
        aberto={modalAberto}
        colheita={colheita}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}
