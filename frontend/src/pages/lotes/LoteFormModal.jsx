import { Alert, App, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Typography } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { atualizarLoteCafe, cadastrarLoteCafe } from '../../api/lotesCafeApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { formatarQuantidade } from '../../utils/formatadores.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { rotuloSafra } from '../manejo/opcoesAtividade.js';
import { OPCOES_UNIDADE_COLHEITA, paraQuilogramas, siglaUnidadeColheita } from '../colheitas/opcoesColheita.js';
import { calcularRendimento, formatarPercentual, OPCOES_PROCESSAMENTO, pesoDoLoteKg } from './opcoesLote.js';

const ID_FORMULARIO = 'formulario-lote-cafe';

function montarValoresIniciais(lote) {
  if (!lote) return { dataArmazenamento: dayjs() };

  return {
    nome: lote.nome,
    quantidade: lote.quantidade,
    unidadeMedida: lote.unidadeMedida,
    dataArmazenamento: dayjs(lote.dataArmazenamento),
    formaProcessamento: lote.formaProcessamento,
    umidade: lote.umidade,
    observacao: lote.observacao,
  };
}

function montarDadosEnvio(valores) {
  return {
    nome: valores.nome,
    quantidade: valores.quantidade,
    unidadeMedida: valores.unidadeMedida,
    dataArmazenamento: valores.dataArmazenamento.format('YYYY-MM-DD'),
    formaProcessamento: valores.formaProcessamento,
    umidade: valores.umidade ?? null,
    observacao: valores.observacao?.trim() || null,
  };
}

function montarResumoSafra(lote, safra) {
  if (lote) {
    return {
      colhidoKg: lote.totalColhidoSafraKg,
      outrosLotesKg: lote.totalLotesSafraKg - pesoDoLoteKg(lote),
    };
  }

  if (!safra) return null;

  return { colhidoKg: safra.totalColhidoKg, outrosLotesKg: safra.totalLotesKg };
}

export function LoteFormModal({ aberto, lote, safras = [], aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(lote);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar lote de café' : 'Novo lote de café'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={720}
    >
      <FormularioLote lote={lote} safras={safras} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioLote({ lote, safras, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message, modal } = App.useApp();

  const editando = Boolean(lote);
  const safraEscolhida = Form.useWatch('safraId', form);
  const quantidade = Form.useWatch('quantidade', form);
  const unidade = Form.useWatch('unidadeMedida', form);

  const resumo = montarResumoSafra(lote, safras.find((s) => s.id === safraEscolhida));
  const disponivelKg = resumo ? Math.max(resumo.colhidoKg - resumo.outrosLotesKg, 0) : null;
  const loteKg = paraQuilogramas(quantidade, unidade);
  const rendimento = resumo ? calcularRendimento(resumo.outrosLotesKg + loteKg, resumo.colhidoKg) : null;

  const opcoesSafra = safras.map((s) => ({ value: s.id, label: rotuloSafra(s) }));

  function validadorPeso() {
    return {
      validator(_, valor) {
        if (!resumo || !valor || !form.getFieldValue('unidadeMedida')) return Promise.resolve();
        const pesoKg = paraQuilogramas(valor, form.getFieldValue('unidadeMedida'));
        return pesoKg >= disponivelKg
          ? Promise.reject(new Error(`O peso deve ser menor que ${formatarQuantidade(disponivelKg, 'kg')} (disponível na safra).`))
          : Promise.resolve();
      },
    };
  }

  async function salvar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = montarDadosEnvio(valores);

    try {
      if (editando) {
        await atualizarLoteCafe(lote.id, dados);
        message.success('Lote atualizado com sucesso.');
      } else {
        await cadastrarLoteCafe({ ...dados, safraId: valores.safraId });
        message.success('Lote cadastrado com sucesso.');
      }
      aoSalvar();
    } catch (erro) {
      if (!aplicarErrosNoFormulario(form, erro)) {
        setMensagemErro(tratarErroApi(erro));
      }
    } finally {
      setSalvando(false);
    }
  }

  function aoEnviar(valores) {
    if (!editando) {
      salvar(valores);
      return;
    }

    modal.confirm({
      title: 'Salvar as alterações do lote?',
      content: 'Os dados atuais do lote serão substituídos pelos novos.',
      okText: 'Salvar',
      cancelText: 'Cancelar',
      onOk: () => salvar(valores),
    });
  }

  return (
    <>
      {mensagemErro && <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(lote)}
        onFinish={aoEnviar}
        onValuesChange={(alterados) => {
          setMensagemErro(null);
          if ('unidadeMedida' in alterados && form.getFieldValue('quantidade')) {
            form.validateFields(['quantidade']);
          }
        }}
      >
        {editando ? (
          <Form.Item label="Safra">
            <Input value={`${lote.anoAgricolaSafra} · ${lote.nomePropriedade}`} disabled />
          </Form.Item>
        ) : (
          <Form.Item name="safraId" label="Safra" rules={[{ required: true, message: 'Selecione a safra.' }]}>
            <Select
              options={opcoesSafra}
              placeholder="Selecione a safra"
              showSearch
              optionFilterProp="label"
              notFoundContent="Nenhuma safra cadastrada"
            />
          </Form.Item>
        )}

        {resumo && resumo.colhidoKg === 0 && (
          <Alert
            type="warning"
            showIcon
            title="Esta safra ainda não tem colheitas registradas."
            description="Registre as colheitas em Produção > Colheitas antes de formar lotes."
            style={{ marginBottom: 16 }}
          />
        )}

        {resumo && resumo.colhidoKg > 0 && (
          <Alert
            type="info"
            showIcon
            title={`Colhido na safra: ${formatarQuantidade(resumo.colhidoKg, 'kg')} · Em outros lotes: ${formatarQuantidade(resumo.outrosLotesKg, 'kg')}`}
            description={
              <>
                O peso deste lote deve ser menor que <strong>{formatarQuantidade(disponivelKg, 'kg')}</strong>.{' '}
                <Typography.Text type="secondary">
                  Rendimento da safra com este lote: {formatarPercentual(rendimento)}
                </Typography.Text>
              </>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Lote
        </Divider>

        <Form.Item
          name="nome"
          label="Nome do lote"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome do lote.' },
            { max: 100, message: 'O nome deve ter no máximo 100 caracteres.' },
          ]}
        >
          <Input placeholder="Ex.: Lote 01 – Via seca 2026" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="quantidade"
              label="Peso armazenado"
              dependencies={['unidadeMedida']}
              rules={[
                { required: true, message: 'Informe o peso.' },
                { type: 'number', min: 0.001, message: 'O peso deve ser maior que zero.' },
                validadorPeso(),
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix={siglaUnidadeColheita(unidade) || undefined}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="unidadeMedida"
              label="Unidade de medida"
              rules={[{ required: true, message: 'Selecione a unidade.' }]}
            >
              <Select options={OPCOES_UNIDADE_COLHEITA} placeholder="Selecione" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="dataArmazenamento"
              label="Data de armazenamento"
              rules={[{ required: true, message: 'Informe a data de armazenamento.' }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                disabledDate={(dia) => dia && dia > dayjs().endOf('day')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item
              name="formaProcessamento"
              label="Forma de processamento"
              rules={[{ required: true, message: 'Selecione a forma de processamento.' }]}
            >
              <Select options={OPCOES_PROCESSAMENTO} placeholder="Selecione" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="umidade"
              label="Umidade (opcional)"
              rules={[
                { type: 'number', min: 0.01, message: 'Deve ser maior que zero.' },
                { type: 'number', max: 100, message: 'No máximo 100%.' },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                precision={2}
                decimalSeparator=","
                suffix="%"
                placeholder="Ex.: 11,5"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="observacao"
          label="Observação (opcional)"
          rules={[{ max: 250, message: 'A observação deve ter no máximo 250 caracteres.' }]}
        >
          <Input.TextArea rows={2} showCount maxLength={250} />
        </Form.Item>
      </Form>
    </>
  );
}
