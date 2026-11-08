import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Result,
  Row,
  Select,
  Spin,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { atualizarCompra, cadastrarCompra, obterCompra } from '../../api/comprasApi.js';
import { listarFornecedores } from '../../api/fornecedoresApi.js';
import { listarInsumos } from '../../api/insumosApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { siglaUnidade } from '../../utils/opcoesInsumo.js';
import { calcularSubtotal, calcularTotal } from './calculosCompra.js';

export function CompraFormulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const [dados, setDados] = useState(null);
  const [erroCarga, setErroCarga] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ignorar = false;

    Promise.all([
      listarFornecedores({ ativo: true }),
      listarInsumos({ ativo: true }),
      editando ? obterCompra(id) : Promise.resolve(null),
    ])
      .then(([fornecedores, insumos, compra]) => {
        if (!ignorar) {
          setDados({ fornecedores, insumos, compra, idCarregado: id ?? null });
          setErroCarga(null);
        }
      })
      .catch((e) => {
        if (!ignorar) setErroCarga({ status: e.response?.status, mensagem: tratarErroApi(e) });
      });

    return () => {
      ignorar = true;
    };
  }, [id, editando, tentativa]);

  function tentarNovamente() {
    setErroCarga(null);
    setTentativa((t) => t + 1);
  }

  const titulo = editando ? 'Editar compra' : 'Nova compra';

  if (erroCarga) {
    return (
      <Result
        status={erroCarga.status === 404 ? '404' : 'error'}
        title={erroCarga.status === 404 ? 'Compra não encontrada' : 'Não foi possível carregar o formulário'}
        subTitle={erroCarga.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/compras')}>Voltar para a lista</Button>
            {erroCarga.status !== 404 && (
              <Button type="primary" onClick={tentarNovamente}>
                Tentar novamente
              </Button>
            )}
          </Flex>
        }
      />
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { title: 'Suprimentos' },
          { title: <Link to="/compras">Compras</Link> },
          { title: titulo },
        ]}
        style={{ marginBottom: 6 }}
      />

      <div style={{ marginBottom: 22 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {titulo}
        </Typography.Title>
        <Typography.Text type="secondary">
          O valor total é calculado pelos itens, e as quantidades entram no estoque dos insumos ao salvar.
        </Typography.Text>
      </div>

      {dados && dados.idCarregado === (id ?? null) ? (
        <FormularioCompra key={id ?? 'nova'} dados={dados} />
      ) : (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      )}
    </div>
  );
}

function montarOpcoesFornecedor(fornecedores, compra) {
  const opcoes = fornecedores.map((f) => ({ value: f.id, label: `${f.razaoSocial} (${f.cpfCnpj})` }));

  if (compra && !fornecedores.some((f) => f.id === compra.fornecedorId)) {
    opcoes.push({ value: compra.fornecedorId, label: `${compra.nomeFornecedor} (inativo)` });
  }

  return opcoes;
}

function montarInsumosDisponiveis(insumos, compra) {
  const mapa = new Map(insumos.map((i) => [i.id, { nome: i.nome, unidadeMedida: i.unidadeMedida, ativo: true }]));

  compra?.itens.forEach((item) => {
    if (!mapa.has(item.insumoId)) {
      mapa.set(item.insumoId, { nome: item.nomeInsumo, unidadeMedida: item.unidadeMedida, ativo: false });
    }
  });

  return mapa;
}

function montarValoresIniciais(compra) {
  if (!compra) {
    return { dataCompra: dayjs(), itens: [{}] };
  }

  return {
    notaFiscal: compra.notaFiscal,
    dataCompra: dayjs(compra.dataCompra),
    fornecedorId: compra.fornecedorId,
    itens: compra.itens.map((item) => ({
      insumoId: item.insumoId,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    })),
  };
}

function FormularioCompra({ dados }) {
  const { fornecedores, insumos, compra } = dados;
  const editando = Boolean(compra);

  const [form] = Form.useForm();
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const itens = Form.useWatch('itens', form);
  const total = calcularTotal(itens);

  const opcoesFornecedor = montarOpcoesFornecedor(fornecedores, compra);
  const insumosDisponiveis = montarInsumosDisponiveis(insumos, compra);
  const opcoesInsumo = [...insumosDisponiveis.entries()].map(([insumoId, insumo]) => ({
    value: insumoId,
    label: insumo.ativo
      ? `${insumo.nome} (${siglaUnidade(insumo.unidadeMedida)})`
      : `${insumo.nome} (${siglaUnidade(insumo.unidadeMedida)}) – inativo`,
  }));

  function siglaDoItem(indice) {
    const insumoId = itens?.[indice]?.insumoId;
    return siglaUnidade(insumosDisponiveis.get(insumoId)?.unidadeMedida);
  }

  function validadorInsumoRepetido(indice) {
    return {
      validator(_, valor) {
        const repetido = (form.getFieldValue('itens') ?? []).some(
          (item, i) => i !== indice && valor && item?.insumoId === valor,
        );
        return repetido
          ? Promise.reject(new Error('Este insumo já está em outro item.'))
          : Promise.resolve();
      },
    };
  }

  function aoMudarValores(alterados) {
    setMensagemErro(null);

    if (!alterados.itens?.some((item) => item && 'insumoId' in item)) return;

    const camposComErro = (form.getFieldValue('itens') ?? [])
      .map((_, indice) => ['itens', indice, 'insumoId'])
      .filter((caminho) => form.getFieldError(caminho).length > 0);

    if (camposComErro.length > 0) {
      form.validateFields(camposComErro).catch(() => {});
    }
  }

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const corpo = {
      notaFiscal: valores.notaFiscal,
      dataCompra: valores.dataCompra.format('YYYY-MM-DD'),
      fornecedorId: valores.fornecedorId,
      itens: valores.itens.map((item) => ({
        insumoId: item.insumoId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
      })),
    };

    try {
      if (editando) {
        await atualizarCompra(compra.id, corpo);
        message.success('Compra atualizada com sucesso.');
        navigate(`/compras/${compra.id}`);
      } else {
        const criada = await cadastrarCompra(corpo);
        message.success('Compra registrada com sucesso. O estoque dos insumos foi atualizado.');
        navigate(`/compras/${criada.id}`);
      }
    } catch (erro) {
      if (!aplicarErrosNoFormulario(form, erro)) {
        setMensagemErro(tratarErroApi(erro));
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={montarValoresIniciais(compra)}
      onFinish={aoEnviar}
      onValuesChange={aoMudarValores}
    >
      <Flex vertical gap={16}>
        <Card title="Dados da compra">
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item
                name="fornecedorId"
                label="Fornecedor"
                rules={[{ required: true, message: 'Selecione o fornecedor.' }]}
              >
                <Select
                  options={opcoesFornecedor}
                  placeholder="Selecione o fornecedor"
                  showSearch
                  optionFilterProp="label"
                  notFoundContent="Nenhum fornecedor ativo encontrado"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={7}>
              <Form.Item
                name="notaFiscal"
                label="Nota fiscal"
                rules={[
                  { required: true, whitespace: true, message: 'Informe o número da nota fiscal.' },
                  { max: 55, message: 'A nota fiscal deve ter no máximo 55 caracteres.' },
                ]}
              >
                <Input placeholder="Ex.: 000123" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={7}>
              <Form.Item
                name="dataCompra"
                label="Data da compra"
                rules={[{ required: true, message: 'Informe a data da compra.' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  disabledDate={(dia) => dia && dia > dayjs().endOf('day')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Itens da compra">
          <Form.List
            name="itens"
            rules={[
              {
                validator: async (_, lista) => {
                  if (!lista || lista.length === 0) {
                    throw new Error('Adicione pelo menos um item.');
                  }
                },
              },
            ]}
          >
            {(campos, { add, remove }, { errors }) => (
              <>
                {campos.map(({ key, name }) => (
                  <Row key={key} gutter={12} align="top">
                    <Col xs={24} md={9}>
                      <Form.Item
                        name={[name, 'insumoId']}
                        label="Insumo"
                        rules={[{ required: true, message: 'Selecione o insumo.' }, validadorInsumoRepetido(name)]}
                      >
                        <Select
                          options={opcoesInsumo}
                          placeholder="Selecione o insumo"
                          showSearch
                          optionFilterProp="label"
                          notFoundContent="Nenhum insumo ativo encontrado"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={12} md={5}>
                      <Form.Item
                        name={[name, 'quantidade']}
                        label="Quantidade"
                        rules={[
                          { required: true, message: 'Informe a quantidade.' },
                          { type: 'number', min: 0.001, message: 'A quantidade deve ser maior que zero.' },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          step={1}
                          decimalSeparator=","
                          suffix={siglaDoItem(name) || undefined}
                          placeholder="0"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={12} md={5}>
                      <Form.Item
                        name={[name, 'valorUnitario']}
                        label="Valor unitário"
                        rules={[
                          { required: true, message: 'Informe o valor unitário.' },
                          { type: 'number', min: 0, message: 'O valor não pode ser negativo.' },
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

                    <Col xs={18} md={4}>
                      <Form.Item label="Subtotal">
                        <Typography.Text strong>
                          {formatarMoeda(calcularSubtotal(itens?.[name]?.quantidade, itens?.[name]?.valorUnitario))}
                        </Typography.Text>
                      </Form.Item>
                    </Col>

                    <Col xs={6} md={1}>
                      <Form.Item label=" ">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          aria-label="Remover item"
                          disabled={campos.length === 1}
                          onClick={() => remove(name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}

                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                  Adicionar item
                </Button>
                <Form.ErrorList errors={errors} />

                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Valor total: {formatarMoeda(total)}
                  </Typography.Title>
                </Flex>
              </>
            )}
          </Form.List>
        </Card>

        {mensagemErro && <Alert type="error" showIcon title={mensagemErro} />}

        <Flex justify="flex-end" gap={8}>
          <Button onClick={() => navigate(editando ? `/compras/${compra.id}` : '/compras')}>Cancelar</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={salvando}>
            Salvar
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
}
