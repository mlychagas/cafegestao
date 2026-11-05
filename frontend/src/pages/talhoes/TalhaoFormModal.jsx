import { Alert, App, Col, DatePicker, Divider, Form, Input, InputNumber, Row } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import { atualizarTalhao, cadastrarTalhao } from '../../api/talhoesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { formatarArea } from '../../utils/formatadores.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';

const ID_FORMULARIO = 'formulario-talhao';

function montarValoresIniciais(talhao) {
  if (!talhao) return {};

  return {
    nome: talhao.nome,
    areaHa: talhao.areaHa,
    variedades: talhao.variedades,
    dataPlantio: talhao.dataPlantio ? dayjs(talhao.dataPlantio) : null,
    quantidadeMudas: talhao.quantidadeMudas,
    espacamentoLinha: talhao.espacamentoLinha,
    espacamentoPlanta: talhao.espacamentoPlanta,
  };
}

function montarDadosEnvio(valores) {
  return {
    nome: valores.nome,
    areaHa: valores.areaHa,
    variedades: valores.variedades || null,
    dataPlantio: valores.dataPlantio ? valores.dataPlantio.format('YYYY-MM-DD') : null,
    quantidadeMudas: valores.quantidadeMudas ?? null,
    espacamentoLinha: valores.espacamentoLinha ?? null,
    espacamentoPlanta: valores.espacamentoPlanta ?? null,
  };
}

export function TalhaoFormModal({ aberto, propriedadeId, talhao, areaDisponivelHa, aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(talhao);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar talhão' : 'Novo talhão'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={640}
    >
      <FormularioTalhao
        propriedadeId={propriedadeId}
        talhao={talhao}
        areaDisponivelHa={areaDisponivelHa}
        setSalvando={setSalvando}
        aoSalvar={aoSalvar}
      />
    </ModalFormulario>
  );
}

function FormularioTalhao({ propriedadeId, talhao, areaDisponivelHa, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const editando = Boolean(talhao);
  const areaContabilizada = !editando || talhao.ativo;

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = montarDadosEnvio(valores);

    try {
      if (editando) {
        await atualizarTalhao(talhao.id, dados);
        message.success('Talhão atualizado com sucesso.');
      } else {
        await cadastrarTalhao({ ...dados, propriedadeRuralId: propriedadeId });
        message.success('Talhão cadastrado com sucesso.');
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
      {areaContabilizada ? (
        <Alert
          type="info"
          showIcon
          title={`Área disponível para este talhão: ${formatarArea(areaDisponivelHa)}`}
          description="A soma das áreas dos talhões ativos não pode ultrapassar a área cultivada da propriedade."
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          title="Talhão inativo"
          description="A área deste talhão não é contabilizada na área cultivada enquanto ele estiver inativo."
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
        initialValues={montarValoresIniciais(talhao)}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Identificação
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={14}>
            <Form.Item
              name="nome"
              label="Identificação do talhão"
              rules={[
                { required: true, whitespace: true, message: 'Informe a identificação do talhão.' },
                { max: 50, message: 'A identificação deve ter no máximo 50 caracteres.' },
              ]}
            >
              <Input autoFocus placeholder="Ex.: Talhão 1, Lavoura da baixada" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={10}>
            <Form.Item
              name="areaHa"
              label="Área (ha)"
              rules={[
                { required: true, message: 'Informe a área do talhão.' },
                { type: 'number', min: 0.001, message: 'A área do talhão deve ser maior que zero.' },
                {
                  validator(_, valor) {
                    if (!areaContabilizada || valor === null || valor === undefined || valor <= areaDisponivelHa) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(`A área não pode ser maior que a área disponível (${formatarArea(areaDisponivelHa)}).`),
                    );
                  },
                },
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

        <Form.Item
          name="variedades"
          label="Variedades (opcional)"
          rules={[{ max: 100, message: 'As variedades devem ter no máximo 100 caracteres.' }]}
        >
          <Input placeholder="Ex.: Conilon BRS Ouro Preto, Robustas Amazônicos BRS 2314" />
        </Form.Item>

        <Divider titlePlacement="start">Dados de plantio (opcionais)</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="dataPlantio" label="Data de plantio">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="DD/MM/AAAA"
                disabledDate={(dia) => dia && dia > dayjs().endOf('day')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="quantidadeMudas"
              label="Quantidade de mudas"
              rules={[{ type: 'number', min: 1, message: 'A quantidade de mudas deve ser maior que zero.' }]}
            >
              <InputNumber min={1} precision={0} step={100} placeholder="Ex.: 3500" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="espacamentoLinha"
              label="Espaçamento entre linhas (m)"
              rules={[{ type: 'number', min: 0.01, max: 99.999, message: 'Informe um valor entre 0,01 e 99,999 m.' }]}
            >
              <InputNumber
                min={0}
                step={0.1}
                decimalSeparator=","
                suffix="m"
                placeholder="Ex.: 3,5"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="espacamentoPlanta"
              label="Espaçamento entre plantas (m)"
              rules={[{ type: 'number', min: 0.01, max: 99.999, message: 'Informe um valor entre 0,01 e 99,999 m.' }]}
            >
              <InputNumber
                min={0}
                step={0.1}
                decimalSeparator=","
                suffix="m"
                placeholder="Ex.: 1,0"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </>
  );
}