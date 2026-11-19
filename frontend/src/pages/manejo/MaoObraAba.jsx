import { Alert, Button, Flex, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { listarMaoObra } from '../../api/maosObraApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { BotaoEditar, BotaoNovo } from '../../components/Botoes.jsx';
import { formatarMoeda, formatarQuantidade } from '../../utils/formatadores.js';
import { MaoObraFormModal } from './MaoObraFormModal.jsx';
import { formatarValorUnitario, siglaUnidadeMaoObra } from './opcoesMaoObra.js';

const colunas = [
  {
    title: 'Pessoa',
    dataIndex: 'nomePessoa',
    key: 'nomePessoa',
    render: (nome, registro) => (
      <Flex gap={8} align="center">
        {nome}
        {!registro.pessoaAtiva && <Tag>Inativa</Tag>}
      </Flex>
    ),
  },
  { title: 'Função', dataIndex: 'funcao', key: 'funcao' },
  {
    title: 'Quantidade',
    key: 'quantidade',
    render: (_, registro) => formatarQuantidade(registro.quantidade, siglaUnidadeMaoObra(registro.unidadeMedida)),
  },
  {
    title: 'Valor unitário',
    key: 'valorUnitario',
    render: (_, registro) => formatarValorUnitario(registro.valorUnitario, registro.unidadeMedida, formatarMoeda),
  },
  {
    title: 'Subtotal',
    dataIndex: 'valorTotal',
    key: 'valorTotal',
    align: 'right',
    render: formatarMoeda,
  },
];

export function MaoObraAba({ atividade }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  const cancelada = atividade.status === 'Cancelada';
  const total = registros.reduce((soma, registro) => soma + registro.valorTotal, 0);

  useEffect(() => {
    let ignorar = false;

    listarMaoObra(atividade.id)
      .then((dados) => {
        if (!ignorar) {
          setRegistros(dados);
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
  }, [atividade.id, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aposSalvar() {
    setModalAberto(false);
    recarregar();
  }

  const possuiRegistros = registros.length > 0;

  return (
    <>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">Pessoas que trabalharam nesta atividade e o valor de cada uma.</Typography.Text>
        {!cancelada &&
          (possuiRegistros ? (
            <BotaoEditar
              naTabela={false}
              desabilitado={carregando || Boolean(erroLista)}
              onClick={() => setModalAberto(true)}
            />
          ) : (
            <BotaoNovo desabilitado={carregando || Boolean(erroLista)} onClick={() => setModalAberto(true)} />
          ))}
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
        rowKey="pessoaId"
        size="small"
        columns={colunas}
        dataSource={registros}
        loading={carregando}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhuma mão de obra registrada para esta atividade.' }}
      />

      {possuiRegistros && (
        <Flex justify="flex-end" style={{ marginTop: 12 }}>
          <Typography.Text strong>Valor total: {formatarMoeda(total)}</Typography.Text>
        </Flex>
      )}

      <MaoObraFormModal
        aberto={modalAberto}
        atividadeId={atividade.id}
        registros={registros}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </>
  );
}
