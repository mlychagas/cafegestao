import { Alert, App, Button, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { salvarMaoObra } from '../../api/maosObraApi.js';
import { listarPessoas } from '../../api/pessoasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarMoeda, formatarQuantidade } from '../../utils/formatadores.js';
import {
  calcularSubtotal,
  calcularTotal,
  formatarValorUnitario,
  OPCOES_UNIDADE_MAO_OBRA,
  siglaUnidadeMaoObra,
} from './opcoesMaoObra.js';

const ID_FORMULARIO = 'formulario-linha-mao-obra';

function paraItem(registro) {
  return {
    pessoaId: registro.pessoaId,
    nomePessoa: registro.nomePessoa,
    pessoaAtiva: registro.pessoaAtiva,
    funcao: registro.funcao,
    unidadeMedida: registro.unidadeMedida,
    quantidade: registro.quantidade,
    valorUnitario: registro.valorUnitario,
  };
}

function linhaPreenchida(valores) {
  return Object.values(valores ?? {}).some((valor) => valor !== undefined && valor !== null && valor !== '');
}

export function MaoObraFormModal({ aberto, atividadeId, registros, aoFechar, aoSalvar }) {
  return (
    <Modal
      title={registros.length > 0 ? 'Editar mão de obra' : 'Registrar mão de obra'}
      open={aberto}
      onCancel={aoFechar}
      footer={null}
      closable={{ closeIcon: <CloseOutlined />, 'aria-label': 'Fechar' }}
      mask={{ closable: false }}
      width={1000}
      destroyOnHidden
    >
      <FormularioMaoObra atividadeId={atividadeId} registros={registros} aoCancelar={aoFechar} aoSalvar={aoSalvar} />
    </Modal>
  );
}

function FormularioMaoObra({ atividadeId, registros, aoCancelar, aoSalvar }) {
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const [itens, setItens] = useState(() => registros.map(paraItem));
  const [pessoasAtivas, setPessoasAtivas] = useState([]);
  const [carregandoPessoas, setCarregandoPessoas] = useState(true);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const linha = Form.useWatch([], form);
  const sigla = siglaUnidadeMaoObra(linha?.unidadeMedida);
  const total = calcularTotal(itens);

  useEffect(() => {
    let ignorar = false;

    listarPessoas({ ativo: true })
      .then((dados) => {
        if (!ignorar) setPessoasAtivas(dados);
      })
      .catch((erro) => {
        if (!ignorar) setMensagemErro(tratarErroApi(erro));
      })
      .finally(() => {
        if (!ignorar) setCarregandoPessoas(false);
      });

    return () => {
      ignorar = true;
    };
  }, []);

  const nomesPessoas = new Map();
  for (const pessoa of pessoasAtivas) nomesPessoas.set(pessoa.id, { nome: pessoa.nome, ativa: true });
  for (const registro of registros) {
    if (!nomesPessoas.has(registro.pessoaId)) {
      nomesPessoas.set(registro.pessoaId, { nome: registro.nomePessoa, ativa: registro.pessoaAtiva });
    }
  }

  const idsNaTabela = new Set(itens.map((item) => item.pessoaId));
  const opcoesPessoa = [...nomesPessoas.entries()]
    .filter(([id]) => !idsNaTabela.has(id))
    .map(([id, pessoa]) => ({ value: id, label: pessoa.ativa ? pessoa.nome : `${pessoa.nome} – inativa` }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  function adicionar(valores) {
    const pessoa = nomesPessoas.get(valores.pessoaId);

    setItens((atuais) => [
      ...atuais,
      {
        pessoaId: valores.pessoaId,
        nomePessoa: pessoa?.nome ?? '',
        pessoaAtiva: pessoa?.ativa ?? true,
        funcao: valores.funcao.trim(),
        unidadeMedida: valores.unidadeMedida,
        quantidade: valores.quantidade,
        valorUnitario: valores.valorUnitario,
      },
    ]);
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

    setItens((atuais) => atuais.filter((i) => i.pessoaId !== item.pessoaId));
    form.setFieldsValue({
      pessoaId: item.pessoaId,
      funcao: item.funcao,
      unidadeMedida: item.unidadeMedida,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    });
  }

  function removerItem(item) {
    setItens((atuais) => atuais.filter((i) => i.pessoaId !== item.pessoaId));
  }

  async function enviar() {
    setMensagemErro(null);
    setSalvando(true);

    try {
      await salvarMaoObra(
        atividadeId,
        itens.map((item) => ({
          pessoaId: item.pessoaId,
          funcao: item.funcao,
          unidadeMedida: item.unidadeMedida,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
        })),
      );
      message.success('Mão de obra salva com sucesso.');
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
        setMensagemErro('Adicione pelo menos uma pessoa.');
        return;
      }
      enviar();
      return;
    }

    const idsMantidos = new Set(itens.map((item) => item.pessoaId));
    const removidos = registros.filter((registro) => !idsMantidos.has(registro.pessoaId));

    modal.confirm({
      title: 'Salvar as alterações da mão de obra?',
      content: (
        <>
          <p style={{ marginTop: 0 }}>Os dados atuais da mão de obra desta atividade serão substituídos pelos novos.</p>
          {removidos.length > 0 && (
            <Typography.Text type="danger">
              {removidos.length === 1 ? 'Será excluído o registro de: ' : 'Serão excluídos os registros de: '}
              {removidos.map((r) => r.nomePessoa).join(', ')}.
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
      title: 'Pessoa',
      dataIndex: 'nomePessoa',
      key: 'nomePessoa',
      render: (nome, item) => (
        <Flex gap={8} align="center">
          {nome}
          {!item.pessoaAtiva && <Tag>Inativa</Tag>}
        </Flex>
      ),
    },
    { title: 'Função', dataIndex: 'funcao', key: 'funcao' },
    {
      title: 'Quantidade',
      key: 'quantidade',
      render: (_, item) => formatarQuantidade(item.quantidade, siglaUnidadeMaoObra(item.unidadeMedida)),
    },
    {
      title: 'Valor unitário',
      key: 'valorUnitario',
      render: (_, item) => formatarValorUnitario(item.valorUnitario, item.unidadeMedida, formatarMoeda),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      align: 'right',
      render: (_, item) => formatarMoeda(calcularSubtotal(item.quantidade, item.valorUnitario)),
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

      <Form id={ID_FORMULARIO} form={form} layout="vertical" onFinish={adicionar} onValuesChange={() => setMensagemErro(null)}>
        <Row gutter={12} align="top">
          <Col xs={24} md={6}>
            <Form.Item name="pessoaId" label="Pessoa" rules={[{ required: true, message: 'Selecione a pessoa.' }]}>
              <Select
                options={opcoesPessoa}
                loading={carregandoPessoas}
                placeholder="Selecione"
                showSearch
                optionFilterProp="label"
                notFoundContent="Nenhuma pessoa disponível. Cadastre em Planejamento > Pessoas."
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={5}>
            <Form.Item
              name="funcao"
              label="Função"
              rules={[
                { required: true, whitespace: true, message: 'Informe a função.' },
                { max: 50, message: 'Máximo de 50 caracteres.' },
              ]}
            >
              <Input placeholder="Ex.: Colhedor" />
            </Form.Item>
          </Col>

          <Col xs={12} md={4}>
            <Form.Item
              name="unidadeMedida"
              label="Unidade de medida"
              rules={[{ required: true, message: 'Selecione a unidade.' }]}
            >
              <Select options={OPCOES_UNIDADE_MAO_OBRA} placeholder="Selecione" />
            </Form.Item>
          </Col>

          <Col xs={12} md={3}>
            <Form.Item
              name="quantidade"
              label="Quantidade"
              rules={[
                { required: true, message: 'Informe a quantidade.' },
                { type: 'number', min: 0.001, message: 'Deve ser maior que zero.' },
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix={sigla || undefined}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={16} md={4}>
            <Form.Item
              name="valorUnitario"
              label={sigla ? `Valor por ${sigla}` : 'Valor unitário'}
              rules={[
                { required: true, message: 'Informe o valor.' },
                { type: 'number', min: 0, message: 'Não pode ser negativo.' },
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                precision={2}
                decimalSeparator=","
                prefix="R$"
                placeholder="0,00"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={8} md={2}>
            <Form.Item label=" ">
              <Space size={4}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} aria-label="Adicionar pessoa" />
                <Button danger icon={<DeleteOutlined />} aria-label="Limpar linha" onClick={limparLinha} />
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        rowKey="pessoaId"
        size="small"
        columns={colunas}
        dataSource={itens}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Preencha a linha acima e clique em + para adicionar uma pessoa.' }}
      />

      <Flex justify="flex-end" style={{ marginTop: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Valor total: {formatarMoeda(total)}
        </Typography.Title>
      </Flex>

      <Flex justify="flex-end" gap={8} style={{ marginTop: 20 }}>
        <Button onClick={aoCancelar}>Cancelar</Button>
        <Button type="primary" icon={<SaveOutlined />} loading={salvando} onClick={salvar}>
          Salvar
        </Button>
      </Flex>
    </>
  );
}
