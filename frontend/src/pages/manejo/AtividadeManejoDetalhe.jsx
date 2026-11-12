import { App, Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Table, Tag, Typography } from 'antd';
import { RollbackOutlined, StopOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  cancelarAtividadeManejo,
  obterAtividadeManejo,
  reabrirAtividadeManejo,
} from '../../api/atividadesManejoApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarArea, formatarData, formatarQuantidade, textoOuTraco } from '../../utils/formatadores.js';
import { BotaoConfirmar, BotaoEditar, BotaoVoltar } from '../../components/Botoes.jsx';
import { AtividadeManejoFormModal } from './AtividadeManejoFormModal.jsx';
import { MaoObraCard } from './MaoObraCard.jsx';
import { StatusAtividadeTag } from './StatusAtividadeTag.jsx';
import { CONSEQUENCIA_CANCELAR_ATIVIDADE, CONSEQUENCIA_REABRIR_ATIVIDADE } from './opcoesAtividade.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function AtividadeManejoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [atividade, setAtividade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterAtividadeManejo(id)
      .then((dados) => {
        if (!ignorar) {
          setAtividade(dados);
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

  async function cancelar() {
    try {
      await cancelarAtividadeManejo(atividade.id);
      message.success('Atividade cancelada.');
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  async function reabrir() {
    try {
      await reabrirAtividadeManejo(atividade.id);
      message.success('Atividade reaberta.');
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  if (carregando && !atividade) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !atividade) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Atividade não encontrada' : 'Não foi possível carregar a atividade'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/atividades-manejo')}>Voltar para a lista</Button>
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

  const cancelada = atividade.status === 'Cancelada';
  const concluida = atividade.status === 'Concluida';

  const itensDados = [
    { key: 'tipo', label: 'Tipo de manejo', children: atividade.nomeTipoManejo },
    {
      key: 'safra',
      label: 'Safra',
      children: <Link to={`/safras/${atividade.safraId}`}>{atividade.anoAgricolaSafra}</Link>,
    },
    {
      key: 'propriedade',
      label: 'Propriedade rural',
      children: <Link to={`/propriedades/${atividade.propriedadeRuralId}`}>{atividade.nomePropriedade}</Link>,
    },
    { key: 'planejada', label: 'Data planejada', children: formatarData(atividade.dataPlanejada) },
    { key: 'conclusao', label: 'Data de conclusão', children: formatarData(atividade.dataConclusao) },
    { key: 'colheita', label: 'Colheita vinculada', children: atividade.possuiColheita ? 'Sim' : 'Não' },
    { key: 'horasPrevistas', label: 'Horas previstas', children: formatarQuantidade(atividade.horasPrevistas, 'h') },
    { key: 'horasTrabalhadas', label: 'Horas trabalhadas', children: formatarQuantidade(atividade.horasTrabalhadas, 'h') },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(atividade.dataAtualizacao) },
    { key: 'observacao', label: 'Observação', children: textoOuTraco(atividade.observacao), span: 'filled' },
  ];

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

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/atividades-manejo')}>Voltar para Atividades de Manejo</BotaoVoltar>

      <Breadcrumb
        items={[
          { title: 'Planejamento' },
          { title: <Link to="/atividades-manejo">Atividades de Manejo</Link> },
          { title: atividade.descricao },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {atividade.descricao}
            </Typography.Title>
            <StatusAtividadeTag status={atividade.status} />
          </Flex>
          <Typography.Text type="secondary">
            {atividade.nomeTipoManejo} · Safra {atividade.anoAgricolaSafra}
          </Typography.Text>
        </div>

        <Flex gap={8} wrap>
          {!cancelada && <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />}
          {!cancelada && !concluida && (
            <BotaoConfirmar
              naTabela={false}
              perigo
              rotulo="Cancelar atividade"
              titulo="Cancelar esta atividade?"
              descricao={CONSEQUENCIA_CANCELAR_ATIVIDADE}
              icone={<StopOutlined />}
              onConfirmar={cancelar}
            />
          )}
          {cancelada && (
            <BotaoConfirmar
              naTabela={false}
              rotulo="Reabrir atividade"
              titulo="Reabrir esta atividade?"
              descricao={CONSEQUENCIA_REABRIR_ATIVIDADE}
              icone={<RollbackOutlined />}
              onConfirmar={reabrir}
            />
          )}
        </Flex>
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados da atividade">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title="Talhões trabalhados">
          <Table
            rowKey="id"
            size="small"
            columns={colunasTalhoes}
            dataSource={atividade.talhoes}
            pagination={false}
          />
        </Card>

        <MaoObraCard atividade={atividade} />
      </Flex>

      <AtividadeManejoFormModal
        aberto={modalAberto}
        atividade={atividade}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}
