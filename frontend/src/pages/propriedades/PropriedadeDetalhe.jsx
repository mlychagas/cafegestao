import { App, Breadcrumb, Button, Card, Descriptions, Empty, Flex, Result, Spin, Tag, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { inativarPropriedade, obterPropriedade, reativarPropriedade } from '../../api/propriedadesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarArea, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoNovo, BotaoSituacao, BotaoVoltar } from '../../components/Botoes.jsx';
import { PropriedadeFormModal } from './PropriedadeFormModal.jsx';
import { CONSEQUENCIA_INATIVAR, CONSEQUENCIA_REATIVAR } from './textosPropriedade.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function PropriedadeDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [propriedade, setPropriedade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterPropriedade(id)
      .then((dados) => {
        if (!ignorar) {
          setPropriedade(dados);
          setErro(null);
        }
      })
      .catch((e) => {
        if (!ignorar) {
          setErro({ status: e.response?.status, mensagem: tratarErroApi(e) });
        }
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
      if (propriedade.ativo) {
        await inativarPropriedade(propriedade.id);
        message.success('Propriedade inativada.');
      } else {
        await reativarPropriedade(propriedade.id);
        message.success('Propriedade reativada.');
      }
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  const botaoVoltar = (
    <BotaoVoltar onClick={() => navigate('/propriedades')}>Voltar para Propriedades Rurais</BotaoVoltar>
  );

  if (carregando && !propriedade) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !propriedade) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Propriedade não encontrada' : 'Não foi possível carregar a propriedade'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/propriedades')}>Voltar para a lista</Button>
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

  const { endereco } = propriedade;

  const itensDadosGerais = [
    { key: 'proprietario', label: 'Proprietário', children: textoOuTraco(propriedade.nomeProprietario) },
    { key: 'cpf', label: 'CPF do proprietário', children: textoOuTraco(propriedade.cpfProprietario) },
    { key: 'unidade', label: 'Unidade de medida', children: 'Hectares (ha)' },
    { key: 'areaTotal', label: 'Área total', children: formatarArea(propriedade.areaTotalHa) },
    { key: 'areaCultivada', label: 'Área cultivada', children: formatarArea(propriedade.areaCultivadaHa) },
    {
      key: 'areaTalhoes',
      label: 'Área em talhões ativos',
      children: `${formatarArea(propriedade.areaTalhoesHa)} (${propriedade.quantidadeTalhoes} talhão(ões))`,
    },
  ];

  const itensEndereco = [
    { key: 'cep', label: 'CEP', children: endereco.cep },
    { key: 'rua', label: 'Rua', children: endereco.rua },
    { key: 'numero', label: 'Número', children: endereco.numero },
    { key: 'bairro', label: 'Bairro', children: endereco.bairro },
    { key: 'cidade', label: 'Cidade', children: endereco.cidade },
    { key: 'uf', label: 'Estado (UF)', children: endereco.uf },
    { key: 'pais', label: 'País', children: textoOuTraco(endereco.pais) },
    { key: 'complemento', label: 'Complemento', children: textoOuTraco(endereco.complemento) },
  ];

  return (
    <Spin spinning={carregando}>
      {botaoVoltar}

      <Breadcrumb
        items={[
          { title: 'Planejamento' },
          { title: <Link to="/propriedades">Propriedades Rurais</Link> },
          { title: propriedade.nome },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {propriedade.nome}
            </Typography.Title>
            {propriedade.ativo ? <Tag color="green">Ativa</Tag> : <Tag>Inativa</Tag>}
          </Flex>
          <Typography.Text type="secondary">{textoOuTraco(propriedade.nomeProprietario)}</Typography.Text>
        </div>

        <Flex gap={8} wrap>
          <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
          <BotaoSituacao
            naTabela={false}
            ativo={propriedade.ativo}
            nomeItem="esta propriedade"
            consequenciaInativar={CONSEQUENCIA_INATIVAR}
            consequenciaReativar={CONSEQUENCIA_REATIVAR}
            onConfirmar={alterarSituacao}
          />
        </Flex>
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados gerais">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDadosGerais} />
        </Card>

        <Card title="Endereço">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensEndereco} />
        </Card>

        <Card
          title="Talhões"
          extra={
            <Tooltip title="O cadastro de talhões será liberado na próxima etapa.">
              <span>
                <BotaoNovo desabilitado />
              </span>
            </Tooltip>
          }
        >
          <Typography.Paragraph type="secondary">
            Subdivisões da propriedade rural utilizadas no planejamento de safras.
          </Typography.Paragraph>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              propriedade.quantidadeTalhoes > 0
                ? `${propriedade.quantidadeTalhoes} talhão(ões) ativo(s), somando ${formatarArea(propriedade.areaTalhoesHa)}.`
                : 'Nenhum talhão cadastrado nesta propriedade.'
            }
          />
        </Card>
      </Flex>

      <PropriedadeFormModal
        aberto={modalAberto}
        propriedade={propriedade}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}