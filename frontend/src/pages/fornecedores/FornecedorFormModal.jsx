import { Alert, App, Col, Divider, Form, Input, Row } from 'antd';
import { useState } from 'react';
import { atualizarFornecedor, cadastrarFornecedor } from '../../api/fornecedoresApi.js';
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

const ID_FORMULARIO = 'formulario-fornecedor';

const VALORES_PADRAO = {
  endereco: { pais: 'Brasil' },
};

function montarValoresIniciais(fornecedor) {
  if (!fornecedor) return VALORES_PADRAO;

  return {
    razaoSocial: fornecedor.razaoSocial,
    cpfCnpj: fornecedor.cpfCnpj,
    telefone: fornecedor.telefone,
    celular: fornecedor.celular,
    email: fornecedor.email,
    endereco: {
      cep: fornecedor.endereco.cep,
      uf: fornecedor.endereco.uf,
      cidade: fornecedor.endereco.cidade,
      rua: fornecedor.endereco.rua,
      numero: fornecedor.endereco.numero,
      bairro: fornecedor.endereco.bairro,
      pais: fornecedor.endereco.pais || 'Brasil',
      complemento: fornecedor.endereco.complemento,
    },
  };
}

function validadorDocumento(_, valor) {
  if (!valor || validarCpfCnpj(valor)) return Promise.resolve();
  return Promise.reject(new Error('CPF ou CNPJ inválido. Confira os números digitados.'));
}

export function FornecedorFormModal({ aberto, fornecedor, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(fornecedor);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar fornecedor' : 'Novo fornecedor'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={720}
    >
      <FormularioFornecedor fornecedor={fornecedor} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioFornecedor({ fornecedor, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const editando = Boolean(fornecedor);

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = { ...valores, celular: valores.celular || null };

    try {
      if (editando) {
        await atualizarFornecedor(fornecedor.id, dados);
        message.success('Fornecedor atualizado com sucesso.');
      } else {
        await cadastrarFornecedor(dados);
        message.success('Fornecedor cadastrado com sucesso.');
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
        initialValues={montarValoresIniciais(fornecedor)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Dados do fornecedor
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={15}>
            <Form.Item
              name="razaoSocial"
              label="Razão social / nome"
              rules={[
                { required: true, whitespace: true, message: 'Informe a razão social ou o nome do fornecedor.' },
                { max: 150, message: 'A razão social deve ter no máximo 150 caracteres.' },
              ]}
            >
              <Input autoFocus placeholder="Ex.: Agropecuária Boa Safra Ltda." />
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
