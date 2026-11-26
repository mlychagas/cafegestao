import { Alert, App, Col, Divider, Form, Input, Row } from 'antd';
import { useState } from 'react';
import { atualizarCliente, cadastrarCliente } from '../../api/clientesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { validarCpfCnpj } from '../../utils/documentos.js';
import {
  mascararCpfCnpj,
  mascararTelefone,
  REGEX_CELULAR,
  REGEX_EMAIL,
  REGEX_TELEFONE,
} from '../../utils/mascaras.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { CamposEndereco } from '../../components/CamposEndereco.jsx';

const ID_FORMULARIO = 'formulario-cliente';

const VALORES_PADRAO = {
  endereco: { pais: 'Brasil' },
};

function montarValoresIniciais(cliente) {
  if (!cliente) return VALORES_PADRAO;

  return {
    nome: cliente.nome,
    cpfCnpj: cliente.cpfCnpj,
    telefone: cliente.telefone,
    celular: cliente.celular,
    email: cliente.email,
    endereco: {
      cep: cliente.endereco.cep,
      uf: cliente.endereco.uf,
      cidade: cliente.endereco.cidade,
      rua: cliente.endereco.rua,
      numero: cliente.endereco.numero,
      bairro: cliente.endereco.bairro,
      pais: cliente.endereco.pais || 'Brasil',
      complemento: cliente.endereco.complemento,
    },
  };
}

function validadorDocumento(_, valor) {
  if (!valor || validarCpfCnpj(valor)) return Promise.resolve();
  return Promise.reject(new Error('CPF ou CNPJ inválido. Confira os números digitados.'));
}

export function ClienteFormModal({ aberto, cliente, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(cliente);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar cliente' : 'Novo cliente'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={720}
    >
      <FormularioCliente cliente={cliente} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioCliente({ cliente, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const editando = Boolean(cliente);

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = { ...valores, celular: valores.celular || null };

    try {
      if (editando) {
        await atualizarCliente(cliente.id, dados);
        message.success('Cliente atualizado com sucesso.');
      } else {
        await cadastrarCliente(dados);
        message.success('Cliente cadastrado com sucesso.');
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
        initialValues={montarValoresIniciais(cliente)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Dados do cliente
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={15}>
            <Form.Item
              name="nome"
              label="Nome"
              rules={[
                { required: true, whitespace: true, message: 'Informe o nome do cliente.' },
                { max: 150, message: 'O nome deve ter no máximo 150 caracteres.' },
              ]}
            >
              <Input autoFocus placeholder="Ex.: Cooperativa Regional de Cafeicultores" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={9}>
            <Form.Item
              name="cpfCnpj"
              label="CPF ou CNPJ"
              normalize={mascararCpfCnpj}
              validateFirst
              rules={[
                { required: true, message: 'Informe o CPF ou o CNPJ.' },
                { validator: validadorDocumento },
              ]}
            >
              <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start">Contato</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="telefone"
              label="Telefone"
              normalize={mascararTelefone}
              rules={[
                { required: true, message: 'Informe o telefone.' },
                { pattern: REGEX_TELEFONE, message: 'Informe o telefone no formato (00) 0000-0000 ou (00) 00000-0000.' },
              ]}
            >
              <Input placeholder="(00) 0000-0000" inputMode="tel" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="celular"
              label="Celular (opcional)"
              normalize={mascararTelefone}
              rules={[{ pattern: REGEX_CELULAR, message: 'Informe o celular no formato (00) 00000-0000.' }]}
            >
              <Input placeholder="(00) 00000-0000" inputMode="tel" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, whitespace: true, message: 'Informe o e-mail.' },
                { pattern: REGEX_EMAIL, message: 'Informe um e-mail válido.' },
                { max: 100, message: 'O e-mail deve ter no máximo 100 caracteres.' },
              ]}
            >
              <Input placeholder="contato@empresa.com.br" inputMode="email" />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start">Endereço</Divider>

        <CamposEndereco />
      </Form>
    </>
  );
}
