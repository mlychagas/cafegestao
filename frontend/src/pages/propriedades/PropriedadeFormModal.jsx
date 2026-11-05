import { Alert, App, Col, Divider, Form, Input, InputNumber, Row, Select } from 'antd';
import { useState } from 'react';
import { atualizarPropriedade, cadastrarPropriedade } from '../../api/propriedadesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { mascararCep, mascararCpf, REGEX_CEP, REGEX_CPF } from '../../utils/mascaras.js';
import { OPCOES_UF } from '../../utils/ufs.js';

const VALORES_PADRAO = {
  endereco: { pais: 'Brasil' },
};

function montarValoresIniciais(propriedade) {
  if (!propriedade) return VALORES_PADRAO;

  return {
    nome: propriedade.nome,
    areaTotalHa: propriedade.areaTotalHa,
    areaCultivadaHa: propriedade.areaCultivadaHa,
    nomeProprietario: propriedade.nomeProprietario,
    cpfProprietario: propriedade.cpfProprietario,
    endereco: {
      cep: propriedade.endereco.cep,
      uf: propriedade.endereco.uf,
      cidade: propriedade.endereco.cidade,
      rua: propriedade.endereco.rua,
      numero: propriedade.endereco.numero,
      bairro: propriedade.endereco.bairro,
      pais: propriedade.endereco.pais || 'Brasil',
      complemento: propriedade.endereco.complemento,
    },
  };
}

const ID_FORMULARIO = 'formulario-propriedade';

export function PropriedadeFormModal({ aberto, propriedade, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(propriedade);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar propriedade rural' : 'Nova propriedade rural'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={720}
    >
      <FormularioPropriedade propriedade={propriedade} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioPropriedade({ propriedade, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const editando = Boolean(propriedade);

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    try {
      if (editando) {
        await atualizarPropriedade(propriedade.id, valores);
        message.success('Propriedade atualizada com sucesso.');
      } else {
        await cadastrarPropriedade(valores);
        message.success('Propriedade cadastrada com sucesso.');
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

  return (
    <>
      {mensagemErro && (
        <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />
      )}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(propriedade)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Dados gerais
        </Divider>

        <Form.Item
          name="nome"
          label="Nome da propriedade"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome da propriedade.' },
            { max: 50, message: 'O nome deve ter no máximo 50 caracteres.' },
          ]}
        >
          <Input autoFocus placeholder="Ex.: Sítio Boa Esperança" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="areaTotalHa"
              label="Área total (ha)"
              rules={[
                { required: true, message: 'Informe a área total.' },
                { type: 'number', min: 0.001, message: 'A área total deve ser maior que zero.' },
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix="ha"
                placeholder="0,000"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="areaCultivadaHa"
              label="Área cultivada (ha)"
              dependencies={['areaTotalHa']}
              rules={[
                { required: true, message: 'Informe a área cultivada (use 0 se não houver).' },
                { type: 'number', min: 0, message: 'A área cultivada não pode ser negativa.' },
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    const total = getFieldValue('areaTotalHa');
                    if (valor === null || valor === undefined || total === null || total === undefined || valor <= total) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('A área cultivada não pode ser maior que a área total.'));
                  },
                }),
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix="ha"
                placeholder="0,000"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={14}>
            <Form.Item
              name="nomeProprietario"
              label="Nome do proprietário (opcional)"
              rules={[{ max: 100, message: 'O nome do proprietário deve ter no máximo 100 caracteres.' }]}
            >
              <Input placeholder="Nome do proprietário" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={10}>
            <Form.Item
              name="cpfProprietario"
              label="CPF do proprietário (opcional)"
              normalize={mascararCpf}
              rules={[{ pattern: REGEX_CPF, message: 'Informe o CPF no formato 000.000.000-00.' }]}
            >
              <Input placeholder="000.000.000-00" inputMode="numeric" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start">Endereço</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name={['endereco', 'cep']}
              label="CEP"
              normalize={mascararCep}
              rules={[
                { required: true, message: 'Informe o CEP.' },
                { pattern: REGEX_CEP, message: 'Informe o CEP no formato 00000-000.' },
              ]}
            >
              <Input placeholder="00000-000" inputMode="numeric" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={6}>
            <Form.Item
              name={['endereco', 'uf']}
              label="Estado (UF)"
              rules={[{ required: true, message: 'Selecione a UF.' }]}
            >
              <Select options={OPCOES_UF} placeholder="UF" showSearch />
            </Form.Item>
          </Col>

          <Col xs={24} sm={10}>
            <Form.Item
              name={['endereco', 'cidade']}
              label="Cidade"
              rules={[
                { required: true, whitespace: true, message: 'Informe a cidade.' },
                { max: 100, message: 'A cidade deve ter no máximo 100 caracteres.' },
              ]}
            >
              <Input placeholder="Ex.: Cacoal" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item
              name={['endereco', 'rua']}
              label="Rua / linha / estrada"
              rules={[
                { required: true, whitespace: true, message: 'Informe a rua, linha ou estrada.' },
                { max: 150, message: 'A rua deve ter no máximo 150 caracteres.' },
              ]}
            >
              <Input placeholder="Ex.: linha, estrada, travessão ou rua" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name={['endereco', 'numero']}
              label="Número / km"
              rules={[
                { required: true, whitespace: true, message: 'Informe o número ou o km (use S/N se não houver).' },
                { max: 10, message: 'O número deve ter no máximo 10 caracteres.' },
              ]}
            >
              <Input placeholder="Ex.: quilômetro (Km 20) ou S/N" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name={['endereco', 'bairro']}
              label="Bairro / localidade"
              rules={[
                { required: true, whitespace: true, message: 'Informe o bairro ou a localidade (ex.: Zona Rural).' },
                { max: 50, message: 'O bairro deve ter no máximo 50 caracteres.' },
              ]}
            >
              <Input placeholder="Ex.: Zona Rural ou nome da comunidade" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name={['endereco', 'pais']}
              label="País"
              rules={[{ max: 50, message: 'O país deve ter no máximo 50 caracteres.' }]}
            >
              <Input placeholder="Brasil" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name={['endereco', 'complemento']}
          label="Complemento (opcional)"
          rules={[{ max: 100, message: 'O complemento deve ter no máximo 100 caracteres.' }]}
        >
          <Input placeholder="Ex.: Lote 12, Gleba 5, próximo à escola da linha" />
        </Form.Item>
      </Form>
    </>
  );
}