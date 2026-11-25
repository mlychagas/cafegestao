import { App, Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { inativarLoteCafe, obterLoteCafe, reativarLoteCafe } from '../../api/lotesCafeApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, formatarQuantidade, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoSituacao, BotaoVoltar } from '../../components/Botoes.jsx';
import { siglaUnidadeColheita, UNIDADES_COLHEITA } from '../colheitas/opcoesColheita.js';
import { LoteFormModal } from './LoteFormModal.jsx';
import {
  calcularRendimento,
  CONSEQUENCIA_INATIVAR_LOTE,
  CONSEQUENCIA_REATIVAR_LOTE,
  formatarPercentual,
  FORMAS_PROCESSAMENTO,
} from './opcoesLote.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function LoteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [lote, setLote] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterLoteCafe(id)
      .then((dados) => {
        if (!ignorar) {
          setLote(dados);
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

  async function alterarSituacao() {
    try {
      if (lote.ativo) {
        await inativarLoteCafe(lote.id);
        message.success('Lote inativado.');
      } else {
        await reativarLoteCafe(lote.id);
        message.success('Lote reativado.');
      }
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  if (carregando && !lote) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !lote) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Lote não encontrado' : 'Não foi possível carregar o lote'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/lotes')}>Voltar para a lista</Button>
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
      key: 'safra',
      label: 'Safra',
      children: <Link to={`/safras/${lote.safraId}`}>{lote.anoAgricolaSafra}</Link>,
    },
    {
      key: 'propriedade',
      label: 'Propriedade rural',
      children: <Link to={`/propriedades/${lote.propriedadeRuralId}`}>{lote.nomePropriedade}</Link>,
    },
    { key: 'armazenamento', label: 'Data de armazenamento', children: formatarData(lote.dataArmazenamento) },
    {
      key: 'quantidade',
      label: 'Peso armazenado',
      children: formatarQuantidade(lote.quantidade, siglaUnidadeColheita(lote.unidadeMedida)),
    },
    { key: 'unidade', label: 'Unidade de medida', children: UNIDADES_COLHEITA[lote.unidadeMedida]?.rotulo },
    {
      key: 'processamento',
      label: 'Forma de processamento',
      children: `${FORMAS_PROCESSAMENTO[lote.formaProcessamento]?.rotulo} (${FORMAS_PROCESSAMENTO[lote.formaProcessamento]?.detalhe})`,
    },
    {
      key: 'umidade',
      label: 'Umidade',
      children: lote.umidade === null || lote.umidade === undefined ? '—' : `${formatarQuantidade(lote.umidade)}%`,
    },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(lote.dataAtualizacao) },
    { key: 'observacao', label: 'Observação', children: textoOuTraco(lote.observacao), span: 'filled' },
  ];

  const itensSafra = [
    { key: 'colhido', label: 'Café colhido na safra', children: formatarQuantidade(lote.totalColhidoSafraKg, 'kg') },
    { key: 'lotes', label: 'Armazenado em lotes', children: formatarQuantidade(lote.totalLotesSafraKg, 'kg') },
    {
      key: 'rendimento',
      label: 'Rendimento da safra',
      children: formatarPercentual(calcularRendimento(lote.totalLotesSafraKg, lote.totalColhidoSafraKg)),
    },
  ];

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/lotes')}>Voltar para Lotes de café</BotaoVoltar>

      <Breadcrumb
        items={[{ title: 'Produção' }, { title: <Link to="/lotes">Lotes de café</Link> }, { title: lote.nome }]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {lote.nome}
            </Typography.Title>
            {lote.ativo ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>}
          </Flex>
          <Typography.Text type="secondary">
            Safra {lote.anoAgricolaSafra} · {lote.nomePropriedade}
          </Typography.Text>
        </div>

        <Flex gap={8} wrap>
          <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
          <BotaoSituacao
            naTabela={false}
            ativo={lote.ativo}
            nomeItem="este lote"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_LOTE}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_LOTE}
            onConfirmar={alterarSituacao}
          />
        </Flex>
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados do lote">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title={`Safra ${lote.anoAgricolaSafra}`}>
          <Descriptions column={COLUNAS_DESCRICAO} items={itensSafra} />
        </Card>
      </Flex>

      <LoteFormModal aberto={modalAberto} lote={lote} aoFechar={() => setModalAberto(false)} aoSalvar={aposSalvar} />
    </Spin>
  );
}
