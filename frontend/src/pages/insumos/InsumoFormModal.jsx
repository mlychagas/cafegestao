import { Alert, App, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { useState } from 'react';
import { atualizarInsumo, cadastrarInsumo } from '../../api/insumosApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { OPCOES_CATEGORIA, OPCOES_UNIDADE, siglaUnidade } from '../../utils/opcoesInsumo.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';

const ID_FORMULARIO = 'formulario-insumo';

function montarValoresIniciais(insumo) {
  if (!insumo) return { quantidadeEstoque: 0 };

  return {
    nome: insumo.nome,
    categoria: insumo.categoria,
    unidadeMedida: insumo.unidadeMedida,
    quantidadeEstoque: insumo.quantidadeEstoque,
    descricao: insumo.descricao,
  };
}

export function InsumoFormModal({ aberto, insumo, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(insumo);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar insumo' : 'Novo insumo'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={600}
    >
      <FormularioInsumo insumo={insumo} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioInsumo({ insumo, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const unidadeSelecionada = Form.useWatch('unidadeMedida', form);

  const editando = Boolean(insumo);
  const estoqueBloqueado = editando && insumo.possuiMovimentacoes;

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = { ...valores, descricao: valores.descricao || null };

    try {
      if (editando) {
        await atualizarInsumo(insumo.id, dados);
        message.success('Insumo atualizado com sucesso.');
      } else {
        await cadastrarInsumo(dados);
        message.success('Insumo cadastrado com sucesso.');
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
      {estoqueBloqueado && (
        <Alert
          type="info"
          showIcon
          title="Este insumo possui compras registradas"
          description="A quantidade em estoque e a unidade de medida são controladas pelas compras e não podem ser alteradas aqui."
          style={{ marginBottom: 16 }}
        />
      )}

      {mensagemErro && (
        <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />
      )}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(insumo)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Form.Item
          name="nome"
          label="Nome do insumo"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome do insumo.' },
            { max: 100, message: 'O nome deve ter no máximo 100 caracteres.' },
          ]}
        >
          <Input autoFocus placeholder="Ex.: Ureia 45%, Calcário dolomítico, NPK 20-05-20" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="categoria" label="Categoria" rules={[{ required: true, message: 'Selecione a categoria.' }]}>
              <Select options={OPCOES_CATEGORIA} placeholder="Selecione" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="unidadeMedida"
              label="Unidade de medida"
              rules={[{ required: true, message: 'Selecione a unidade de medida.' }]}
            >
              <Select options={OPCOES_UNIDADE} placeholder="Selecione" disabled={estoqueBloqueado} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="quantidadeEstoque"
          label="Quantidade em estoque"
          rules={[
            { required: true, message: 'Informe a quantidade em estoque (use 0 se não houver).' },
            { type: 'number', min: 0, message: 'A quantidade em estoque não pode ser negativa.' },
          ]}
        >
          <InputNumber
            min={0}
            step={1}
            decimalSeparator=","
            suffix={siglaUnidade(unidadeSelecionada) || undefined}
            placeholder="0"
            disabled={estoqueBloqueado}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Descrição (opcional)"
          rules={[{ max: 150, message: 'A descrição deve ter no máximo 150 caracteres.' }]}
        >
          <Input.TextArea
            rows={3}
            showCount
            maxLength={150}
            placeholder="Ex.: Aplicar na adubação de cobertura, após as chuvas"
          />
        </Form.Item>
      </Form>
    </>
  );
}
