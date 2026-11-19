import { Alert, Button, Flex, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { listarInsumosAtividade } from '../../api/atividadesInsumoApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { BotaoEditar, BotaoNovo } from '../../components/Botoes.jsx';
import { formatarQuantidade } from '../../utils/formatadores.js';
import { siglaUnidade } from '../../utils/opcoesInsumo.js';
import { InsumosAtividadeModal } from './InsumosAtividadeModal.jsx';

const colunas = [
  {
    title: 'Insumo',
    dataIndex: 'nomeInsumo',
    key: 'nomeInsumo',
    render: (nome, registro) => (
      <Flex gap={8} align="center">
        {nome}
        {!registro.insumoAtivo && <Tag>Inativo</Tag>}
      </Flex>
    ),
  },
  {
    title: 'Quantidade utilizada',
    key: 'quantidadeUtilizada',
    render: (_, registro) => formatarQuantidade(registro.quantidadeUtilizada, siglaUnidade(registro.unidadeMedida)),
  },
  {
    title: 'Estoque atual',
    key: 'quantidadeEstoque',
    render: (_, registro) => formatarQuantidade(registro.quantidadeEstoque, siglaUnidade(registro.unidadeMedida)),
  },
];

export function InsumosAtividadeAba({ atividade, aoAlterar }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  const concluida = atividade.status === 'Concluida';
  const possuiRegistros = registros.length > 0;

  useEffect(() => {
    let ignorar = false;

    listarInsumosAtividade(atividade.id)
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
    aoAlterar();
  }

  return (
    <>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">Insumos usados na atividade. A quantidade é baixada do estoque ao salvar.</Typography.Text>
        {concluida &&
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

      {!concluida && !possuiRegistros && !erroLista && (
        <Alert
          type="info"
          showIcon
          title="Os insumos utilizados são registrados depois que a atividade for concluída."
          description="Ao salvar, a quantidade é baixada do estoque de cada insumo."
          style={{ marginBottom: 16 }}
        />
      )}

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
        rowKey="insumoId"
        size="small"
        columns={colunas}
        dataSource={registros}
        loading={carregando}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhum insumo registrado para esta atividade.' }}
      />

      <InsumosAtividadeModal
        aberto={modalAberto}
        atividadeId={atividade.id}
        registros={registros}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </>
  );
}
