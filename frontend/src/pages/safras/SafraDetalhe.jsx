import { Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obterSafra } from '../../api/safrasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarQuantidade } from '../../utils/formatadores.js';
import { siglaProdutividade } from './opcoesSafra.js';
import { BotaoEditar, BotaoVoltar } from '../../components/Botoes.jsx';
import { SafraFormModal } from './SafraFormModal.jsx';
import { StatusSafraTag } from './StatusSafraTag.jsx';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function SafraDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [safra, setSafra] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterSafra(id)
      .then((dados) => {
        if (!ignorar) {
          setSafra(dados);
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

  if (carregando && !safra) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !safra) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Safra não encontrada' : 'Não foi possível carregar a safra'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/safras')}>Voltar para a lista</Button>
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
    {
      key: 'propriedade',
      label: 'Propriedade rural',
      children: <Link to={`/propriedades/${safra.propriedadeRuralId}`}>{safra.nomePropriedade}</Link>,
    },
    { key: 'inicio', label: 'Data de início', children: formatarData(safra.dataInicio) },
    { key: 'fechamento', label: 'Data de fechamento', children: formatarData(safra.dataFechamento) },
    {
      key: 'produtividade',
      label: 'Produtividade estimada',
      children: formatarQuantidade(safra.produtividadeEstimada, siglaProdutividade(safra.unidadeMedida)),
    },
    { key: 'colheitas', label: 'Colheitas', children: safra.quantidadeColheitas },
    { key: 'cadastro', label: 'Cadastrada em', children: formatarData(safra.dataCriacao) },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(safra.dataAtualizacao) },
  ];

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/safras')}>Voltar para Safras</BotaoVoltar>

      <Breadcrumb
        items={[{ title: 'Planejamento' }, { title: <Link to="/safras">Safras</Link> }, { title: `Safra ${safra.anoAgricola}` }]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Safra {safra.anoAgricola}
            </Typography.Title>
            <StatusSafraTag status={safra.status} />
          </Flex>
          <Typography.Text type="secondary">{safra.nomePropriedade}</Typography.Text>
        </div>

        <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados da safra">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>
      </Flex>

      <SafraFormModal
        aberto={modalAberto}
        safra={safra}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}
