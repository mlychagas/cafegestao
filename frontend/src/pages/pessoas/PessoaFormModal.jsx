import { Alert, App, Col, DatePicker, Form, Input, Row } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { atualizarPessoa, cadastrarPessoa } from '../../api/pessoasApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { validarCpf } from '../../utils/documentos.js';
import { mascararCpf, mascararTelefone, REGEX_CPF, REGEX_TELEFONE } from '../../utils/mascaras.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';

const ID_FORMULARIO = 'formulario-pessoa';

const IDADE_MINIMA = 15;

function dataLimiteNascimento() {
  return dayjs().subtract(IDADE_MINIMA, 'year');
}

function montarValoresIniciais(pessoa) {
  if (!pessoa) return {};

  return {
    nome: pessoa.nome,
    cpf: pessoa.cpf,
    telefone: pessoa.telefone,
    dataNascimento: pessoa.dataNascimento ? dayjs(pessoa.dataNascimento) : null,
  };
}

function validadorCpf(_, valor) {
  if (validarCpf(valor)) return Promise.resolve();
  return Promise.reject(new Error('CPF inválido. Confira os números digitados.'));
}

function bloquearMenorDeIdade(data) {
  return data && data.isAfter(dataLimiteNascimento(), 'day');
}

function validadorIdade(_, valor) {
  if (!valor || !bloquearMenorDeIdade(valor)) return Promise.resolve();
  return Promise.reject(new Error(`A pessoa deve ter pelo menos ${IDADE_MINIMA} anos.`));
}

export function PessoaFormModal({ aberto, pessoa, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(pessoa);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar pessoa' : 'Nova pessoa'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={560}
    >
      <FormularioPessoa pessoa={pessoa} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioPessoa({ pessoa, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message, modal } = App.useApp();

  const editando = Boolean(pessoa);

  async function salvar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = {
      nome: valores.nome,
      cpf: valores.cpf,
      telefone: valores.telefone || null,
      dataNascimento: valores.dataNascimento.format('YYYY-MM-DD'),
    };

    try {
      if (editando) {
        await atualizarPessoa(pessoa.id, dados);
        message.success('Pessoa atualizada com sucesso.');
      } else {
        await cadastrarPessoa(dados);
        message.success('Pessoa cadastrada com sucesso.');
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
      title: 'Salvar as alterações da pessoa?',
      content: 'Os dados atuais da pessoa serão substituídos pelos novos.',
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
        initialValues={montarValoresIniciais(pessoa)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Form.Item
          name="nome"
          label="Nome"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome da pessoa.' },
            { max: 100, message: 'O nome deve ter no máximo 100 caracteres.' },
          ]}
        >
          <Input autoFocus placeholder="Ex.: João da Silva" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="cpf"
              label="CPF"
              normalize={mascararCpf}
              validateFirst
              rules={[
                { required: true, message: 'Informe o CPF.' },
                { pattern: REGEX_CPF, message: 'Informe o CPF no formato 000.000.000-00.' },
                { validator: validadorCpf },
              ]}
            >
              <Input placeholder="000.000.000-00" inputMode="numeric" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="telefone"
              label="Telefone (opcional)"
              normalize={mascararTelefone}
              rules={[{ pattern: REGEX_TELEFONE, message: 'Informe o telefone no formato (00) 0000-0000 ou (00) 00000-0000.' }]}
            >
              <Input placeholder="(00) 00000-0000" inputMode="tel" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="dataNascimento"
          label="Data de nascimento"
          rules={[
            { required: true, message: 'Informe a data de nascimento.' },
            { validator: validadorIdade },
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="DD/MM/AAAA"
            disabledDate={bloquearMenorDeIdade}
            defaultPickerValue={dataLimiteNascimento()}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </>
  );
}
