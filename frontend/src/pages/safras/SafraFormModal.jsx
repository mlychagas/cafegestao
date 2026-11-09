import { Alert, App, Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { atualizarSafra, cadastrarSafra } from '../../api/safrasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { OPCOES_STATUS_SAFRA, OPCOES_UNIDADE_PRODUTIVIDADE } from './opcoesSafra.js';

const ID_FORMULARIO = 'formulario-safra';

const REGEX_ANO_AGRICOLA = /^\d{4}(\/\d{4})?$/;

function montarValoresIniciais(safra) {
  if (!safra) return { status: 'Planejada' };

  return {
    anoAgricola: safra.anoAgricola,
    status: safra.status,
    dataInicio: dayjs(safra.dataInicio),
    dataFechamento: safra.dataFechamento ? dayjs(safra.dataFechamento) : null,
    produtividadeEstimada: safra.produtividadeEstimada,
    unidadeMedida: safra.unidadeMedida,
  };
}

function montarDadosEnvio(valores) {
  return {
    anoAgricola: valores.anoAgricola,
    status: valores.status,
    dataInicio: valores.dataInicio.format('YYYY-MM-DD'),
    dataFechamento: valores.dataFechamento ? valores.dataFechamento.format('YYYY-MM-DD') : null,
    produtividadeEstimada: valores.produtividadeEstimada ?? null,
    unidadeMedida: valores.unidadeMedida ?? null,
  };
}

function validarAnoAgricola(_, valor) {
  if (!valor || !REGEX_ANO_AGRICOLA.test(valor)) return Promise.resolve();
  const [inicial, final] = valor.split('/').map(Number);
  if (final !== undefined && final !== inicial + 1) {
    return Promise.reject(new Error('O segundo ano deve ser o seguinte ao primeiro (ex.: 2026/2027).'));
  }
  return Promise.resolve();
}

export function SafraFormModal({ aberto, safra, propriedades = [], aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(safra);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar safra' : 'Nova safra'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={640}
    >
      <FormularioSafra safra={safra} propriedades={propriedades} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioSafra({ safra, propriedades, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message, modal } = App.useApp();

  const editando = Boolean(safra);
  const opcoesPropriedade = propriedades
    .filter((p) => p.ativo)
    .map((p) => ({ value: p.id, label: p.nome }));

  async function salvar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = montarDadosEnvio(valores);

    try {
      if (editando) {
        await atualizarSafra(safra.id, dados);
        message.success('Safra atualizada com sucesso.');
      } else {
        await cadastrarSafra({ ...dados, propriedadeRuralId: valores.propriedadeRuralId });
        message.success('Safra cadastrada com sucesso.');
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
      title: 'Salvar as alterações da safra?',
      content: 'Os dados atuais da safra serão substituídos pelos novos.',
      okText: 'Salvar',
      cancelText: 'Cancelar',
      onOk: () => salvar(valores),
    });
  }

  return (
    <>
      {mensagemErro && (
        <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />
      )}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(safra)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        {editando ? (
          <Form.Item label="Propriedade rural">
            <Input value={safra.nomePropriedade} disabled />
          </Form.Item>
        ) : (
          <Form.Item
            name="propriedadeRuralId"
            label="Propriedade rural"
            rules={[{ required: true, message: 'Selecione a propriedade rural.' }]}
          >
            <Select
              options={opcoesPropriedade}
              placeholder="Selecione a propriedade"
              showSearch
              optionFilterProp="label"
              notFoundContent="Nenhuma propriedade ativa encontrada"
            />
          </Form.Item>
        )}

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="anoAgricola"
              label="Ano agrícola"
              validateFirst
              rules={[
                { required: true, whitespace: true, message: 'Informe o ano agrícola.' },
                { pattern: REGEX_ANO_AGRICOLA, message: 'Use o formato 2026/2027 ou 2026.' },
                { validator: validarAnoAgricola },
              ]}
            >
              <Input autoFocus={!editando} placeholder="Ex.: 2026/2027" maxLength={9} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Selecione o status.' }]}>
              <Select options={OPCOES_STATUS_SAFRA} placeholder="Selecione" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="dataInicio"
              label="Data de início"
              rules={[{ required: true, message: 'Informe a data de início.' }]}
            >
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/AAAA" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="dataFechamento"
              label="Data de fechamento"
              dependencies={['dataInicio', 'status']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    if (!valor && getFieldValue('status') === 'Encerrada') {
                      return Promise.reject(new Error('Informe a data de fechamento para encerrar a safra.'));
                    }
                    const inicio = getFieldValue('dataInicio');
                    if (!valor || !inicio || valor.isAfter(inicio, 'day')) return Promise.resolve();
                    return Promise.reject(new Error('A data de fechamento deve ser posterior à data de início.'));
                  },
                }),
              ]}
            >
              <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/AAAA" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="produtividadeEstimada"
              label="Produtividade estimada (opcional)"
              dependencies={['unidadeMedida']}
              rules={[
                { type: 'number', min: 0.01, message: 'A produtividade estimada deve ser maior que zero.' },
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    if ((valor === null || valor === undefined) && getFieldValue('unidadeMedida')) {
                      return Promise.reject(new Error('Informe a produtividade ou remova a unidade.'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber min={0} step={1} decimalSeparator="," placeholder="Ex.: 45" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="unidadeMedida"
              label="Unidade de medida"
              dependencies={['produtividadeEstimada']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    const produtividade = getFieldValue('produtividadeEstimada');
                    if (!valor && produtividade !== null && produtividade !== undefined) {
                      return Promise.reject(new Error('Selecione a unidade da produtividade.'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Select options={OPCOES_UNIDADE_PRODUTIVIDADE} placeholder="Selecione" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </>
  );
}
