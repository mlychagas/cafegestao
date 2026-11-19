import { Alert, App, Button, Col, Flex, Form, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { salvarInsumosAtividade } from '../../api/atividadesInsumoApi.js';
import { listarInsumos } from '../../api/insumosApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarQuantidade } from '../../utils/formatadores.js';
import { siglaUnidade } from '../../utils/opcoesInsumo.js';

const ID_FORMULARIO = 'formulario-linha-insumo-atividade';

function linhaPreenchida(valores) {
  return Object.values(valores ?? {}).some((valor) => valor !== undefined && valor !== null && valor !== '');
}

export function InsumosAtividadeModal({ aberto, atividadeId, registros, aoFechar, aoSalvar }) {
  return (
    <Modal
      title={registros.length > 0 ? 'Editar insumos utilizados' : 'Registrar insumos utilizados'}
      open={aberto}
      onCancel={aoFechar}
      footer={null}
      closable={{ closeIcon: <CloseOutlined />, 'aria-label': 'Fechar' }}
      mask={{ closable: false }}
      width={860}
      destroyOnHidden
    >
      <FormularioInsumos atividadeId={atividadeId} registros={registros} aoCancelar={aoFechar} aoSalvar={aoSalvar} />
    </Modal>
  );
}

function FormularioInsumos({ atividadeId, registros, aoCancelar, aoSalvar }) {
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const [itens, setItens] = useState(() =>
    registros.map((r) => ({ insumoId: r.insumoId, quantidadeUtilizada: r.quantidadeUtilizada })),
  );
  const [insumosAtivos, setInsumosAtivos] = useState([]);
  const [carregandoInsumos, setCarregandoInsumos] = useState(true);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const insumoSelecionado = Form.useWatch('insumoId', form);

  useEffect(() => {
    let ignorar = false;

    listarInsumos({ ativo: true })
      .then((dados) => {
        if (!ignorar) setInsumosAtivos(dados);
      })
      .catch((erro) => {
        if (!ignorar) setMensagemErro(tratarErroApi(erro));
      })
      .finally(() => {
        if (!ignorar) setCarregandoInsumos(false);
      });

    return () => {
      ignorar = true;
    };
  }, []);

  const insumos = new Map();
  for (const insumo of insumosAtivos) {
    insumos.set(insumo.id, {
      nome: insumo.nome,
      ativo: true,
      unidadeMedida: insumo.unidadeMedida,
      quantidadeEstoque: insumo.quantidadeEstoque,
    });
  }
  for (const registro of registros) {
    insumos.set(registro.insumoId, {
      nome: registro.nomeInsumo,
      ativo: registro.insumoAtivo,
      unidadeMedida: registro.unidadeMedida,
      quantidadeEstoque: registro.quantidadeEstoque,
    });
  }

  const quantidadesSalvas = new Map(registros.map((r) => [r.insumoId, r.quantidadeUtilizada]));

  function disponivel(insumoId) {
    const insumo = insumos.get(insumoId);
    if (!insumo) return 0;
    return insumo.quantidadeEstoque + (quantidadesSalvas.get(insumoId) ?? 0);
  }

  function sigla(insumoId) {
    return siglaUnidade(insumos.get(insumoId)?.unidadeMedida);
  }

  const idsNaTabela = new Set(itens.map((item) => item.insumoId));
  const opcoesInsumo = [...insumos.entries()]
    .filter(([id]) => !idsNaTabela.has(id))
    .map(([id, insumo]) => ({
      value: id,
      label: insumo.ativo ? `${insumo.nome} (${siglaUnidade(insumo.unidadeMedida)})` : `${insumo.nome} – inativo`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const siglaSelecionada = insumoSelecionado ? sigla(insumoSelecionado) : '';

  function validadorSaldo() {
    return {
      validator(_, valor) {
        const insumoId = form.getFieldValue('insumoId');
        if (!insumoId || valor === undefined || valor === null) return Promise.resolve();
        const saldo = disponivel(insumoId);
        return valor > saldo
          ? Promise.reject(new Error(`Maior que o disponível (${formatarQuantidade(saldo, sigla(insumoId))}).`))
          : Promise.resolve();
      },
    };
  }

  function adicionar(valores) {
    setItens((atuais) => [...atuais, { insumoId: valores.insumoId, quantidadeUtilizada: valores.quantidadeUtilizada }]);
    form.resetFields();
    setMensagemErro(null);
  }

  function limparLinha() {
    form.resetFields();
    setMensagemErro(null);
  }

  function editarItem(item) {
    if (linhaPreenchida(form.getFieldsValue())) {
      message.warning('Adicione ou limpe a linha que está sendo preenchida antes de editar outra.');
      return;
    }

    setItens((atuais) => atuais.filter((i) => i.insumoId !== item.insumoId));
    form.setFieldsValue({ insumoId: item.insumoId, quantidadeUtilizada: item.quantidadeUtilizada });
  }

  function removerItem(item) {
    setItens((atuais) => atuais.filter((i) => i.insumoId !== item.insumoId));
  }

  async function enviar() {
    setMensagemErro(null);
    setSalvando(true);

    try {
      await salvarInsumosAtividade(atividadeId, itens);
      message.success('Insumos utilizados salvos. O estoque foi atualizado.');
      aoSalvar();
    } catch (erro) {
      setMensagemErro(tratarErroApi(erro));
    } finally {
      setSalvando(false);
    }
  }

  function salvar() {
    if (linhaPreenchida(form.getFieldsValue())) {
      setMensagemErro('Há uma linha preenchida que não foi adicionada. Clique em + para adicioná-la ou na lixeira para limpá-la.');
      return;
    }

    if (registros.length === 0) {
      if (itens.length === 0) {
        setMensagemErro('Adicione pelo menos um insumo.');
        return;
      }
      enviar();
      return;
    }

    const idsMantidos = new Set(itens.map((item) => item.insumoId));
    const removidos = registros.filter((registro) => !idsMantidos.has(registro.insumoId));

    modal.confirm({
      title: 'Salvar as alterações dos insumos utilizados?',
      content: (
        <>
          <p style={{ marginTop: 0 }}>O estoque dos insumos será ajustado pela diferença das quantidades.</p>
          {removidos.length > 0 && (
            <Typography.Text type="danger">
              {removidos.length === 1 ? 'Será removido e devolvido ao estoque: ' : 'Serão removidos e devolvidos ao estoque: '}
              {removidos.map((r) => r.nomeInsumo).join(', ')}.
            </Typography.Text>
          )}
        </>
      ),
      okText: 'Salvar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: removidos.length > 0 },
      onOk: enviar,
    });
  }

  const colunas = [
    {
      title: 'Insumo',
      key: 'insumo',
      render: (_, item) => {
        const insumo = insumos.get(item.insumoId);
        return (
          <Flex gap={8} align="center">
            {insumo?.nome}
            {insumo && !insumo.ativo && <Tag>Inativo</Tag>}
          </Flex>
        );
      },
    },
    {
      title: 'Quantidade utilizada',
      key: 'quantidade',
      render: (_, item) => formatarQuantidade(item.quantidadeUtilizada, sigla(item.insumoId)),
    },
    {
      title: 'Estoque após salvar',
      key: 'estoqueApos',
      render: (_, item) => formatarQuantidade(disponivel(item.insumoId) - item.quantidadeUtilizada, sigla(item.insumoId)),
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, item) => (
        <Space size={0}>
          <Button type="link" icon={<EditOutlined />} onClick={() => editarItem(item)}>
            Editar
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removerItem(item)}>
            Remover
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {mensagemErro && <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        onFinish={adicionar}
        onValuesChange={(alterados) => {
          setMensagemErro(null);
          if ('insumoId' in alterados && form.getFieldValue('quantidadeUtilizada') !== undefined) {
            form.validateFields(['quantidadeUtilizada']);
          }
        }}
      >
        <Row gutter={12} align="top">
          <Col xs={24} md={12}>
            <Form.Item name="insumoId" label="Insumo" rules={[{ required: true, message: 'Selecione o insumo.' }]}>
              <Select
                options={opcoesInsumo}
                loading={carregandoInsumos}
                placeholder="Selecione"
                showSearch
                optionFilterProp="label"
                notFoundContent="Nenhum insumo disponível. Cadastre em Suprimentos > Insumos."
              />
            </Form.Item>
          </Col>

          <Col xs={16} md={8}>
            <Form.Item
              name="quantidadeUtilizada"
              label="Quantidade utilizada"
              extra={
                insumoSelecionado
                  ? `Disponível: ${formatarQuantidade(disponivel(insumoSelecionado), siglaSelecionada)}`
                  : undefined
              }
              rules={[
                { required: true, message: 'Informe a quantidade.' },
                { type: 'number', min: 0.001, message: 'Deve ser maior que zero.' },
                validadorSaldo(),
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix={siglaSelecionada || undefined}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={8} md={4}>
            <Form.Item label=" ">
              <Space size={4}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} aria-label="Adicionar insumo" />
                <Button danger icon={<DeleteOutlined />} aria-label="Limpar linha" onClick={limparLinha} />
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        rowKey="insumoId"
        size="small"
        columns={colunas}
        dataSource={itens}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Preencha a linha acima e clique em + para adicionar um insumo.' }}
      />

      <Flex justify="flex-end" gap={8} style={{ marginTop: 20 }}>
        <Button onClick={aoCancelar}>Cancelar</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={salvando} onClick={salvar}>
          Salvar
        </Button>
      </Flex>
    </>
  );
}
