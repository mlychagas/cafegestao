import { Alert, App, Button, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { atualizarAtividadeManejo, cadastrarAtividadeManejo } from '../../api/atividadesManejoApi.js';
import { listarTiposManejo } from '../../api/tiposManejoApi.js';
import { listarTalhoes } from '../../api/talhoesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { formatarArea } from '../../utils/formatadores.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { TiposManejoModal } from './TiposManejoModal.jsx';
import { OPCOES_STATUS_EDITAVEIS, rotuloSafra } from './opcoesAtividade.js';

const ID_FORMULARIO = 'formulario-atividade-manejo';

function montarValoresIniciais(atividade) {
  if (!atividade) {
    return { status: 'Agendada', dataPlanejada: dayjs(), talhaoIds: [] };
  }

  return {
    descricao: atividade.descricao,
    tipoManejoId: atividade.tipoManejoId,
    talhaoIds: atividade.talhoes.map((t) => t.id),
    status: atividade.status,
    dataPlanejada: dayjs(atividade.dataPlanejada),
    dataConclusao: atividade.dataConclusao ? dayjs(atividade.dataConclusao) : null,
    horasPrevistas: atividade.horasPrevistas,
    horasTrabalhadas: atividade.horasTrabalhadas,
    observacao: atividade.observacao,
  };
}

function montarDadosEnvio(valores) {
  return {
    descricao: valores.descricao,
    tipoManejoId: valores.tipoManejoId,
    talhaoIds: valores.talhaoIds,
    status: valores.status,
    dataPlanejada: valores.dataPlanejada.format('YYYY-MM-DD'),
    dataConclusao: valores.dataConclusao ? valores.dataConclusao.format('YYYY-MM-DD') : null,
    horasPrevistas: valores.horasPrevistas ?? null,
    horasTrabalhadas: valores.horasTrabalhadas ?? null,
    observacao: valores.observacao || null,
  };
}

export function AtividadeManejoFormModal({ aberto, atividade, safras = [], aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(atividade);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar atividade de manejo' : 'Nova atividade de manejo'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={760}
    >
      <FormularioAtividade atividade={atividade} safras={safras} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioAtividade({ atividade, safras, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [versaoTipos, setVersaoTipos] = useState(0);
  const [tiposAberto, setTiposAberto] = useState(false);
  const [talhoesCarregados, setTalhoesCarregados] = useState({ propriedadeId: null, lista: [] });
  const { message } = App.useApp();

  const editando = Boolean(atividade);
  const safraSelecionada = Form.useWatch('safraId', form);
  const statusSelecionado = Form.useWatch('status', form);

  const propriedadeId = editando
    ? atividade.propriedadeRuralId
    : safras.find((s) => s.id === safraSelecionada)?.propriedadeRuralId;

  useEffect(() => {
    let ignorar = false;

    listarTiposManejo()
      .then((dados) => {
        if (!ignorar) setTipos(dados);
      })
      .catch(() => {});

    return () => {
      ignorar = true;
    };
  }, [versaoTipos]);

  useEffect(() => {
    if (!propriedadeId) return undefined;

    let ignorar = false;

    listarTalhoes({ propriedadeId, ativo: true })
      .then((dados) => {
        if (!ignorar) setTalhoesCarregados({ propriedadeId, lista: dados });
      })
      .catch(() => {});

    return () => {
      ignorar = true;
    };
  }, [propriedadeId]);

  const opcoesSafra = safras
    .filter((s) => s.status !== 'Encerrada')
    .map((s) => ({ value: s.id, label: rotuloSafra(s) }));

  const opcoesTipo = tipos.map((t) => ({ value: t.id, label: t.nome }));

  const talhoesDisponiveis = talhoesCarregados.propriedadeId === propriedadeId ? talhoesCarregados.lista : [];
  const opcoesTalhao = talhoesDisponiveis.map((t) => ({ value: t.id, label: `${t.nome} (${formatarArea(t.areaHa)})` }));

  atividade?.talhoes
    .filter((t) => !talhoesDisponiveis.some((d) => d.id === t.id))
    .forEach((t) => opcoesTalhao.push({ value: t.id, label: `${t.nome} (inativo)` }));

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = montarDadosEnvio(valores);

    try {
      if (editando) {
        await atualizarAtividadeManejo(atividade.id, dados);
        message.success('Atividade atualizada com sucesso.');
      } else {
        await cadastrarAtividadeManejo({ ...dados, safraId: valores.safraId });
        message.success('Atividade cadastrada com sucesso.');
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

  function aoMudarValores(alterados) {
    setMensagemErro(null);
    if ('safraId' in alterados) {
      form.setFieldValue('talhaoIds', []);
    }
  }

  const agendadaNova = !editando && statusSelecionado === 'Agendada';

  return (
    <>
      {mensagemErro && (
        <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />
      )}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(atividade)}
        onFinish={aoEnviar}
        onValuesChange={aoMudarValores}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Atividade
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            {editando ? (
              <Form.Item label="Safra">
                <Input value={`${atividade.anoAgricolaSafra} · ${atividade.nomePropriedade}`} disabled />
              </Form.Item>
            ) : (
              <Form.Item name="safraId" label="Safra" rules={[{ required: true, message: 'Selecione a safra.' }]}>
                <Select
                  options={opcoesSafra}
                  placeholder="Selecione a safra"
                  showSearch
                  optionFilterProp="label"
                  notFoundContent="Nenhuma safra planejada ou em andamento"
                />
              </Form.Item>
            )}
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Tipo de manejo" htmlFor="tipoManejoId" required>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="tipoManejoId"
                  noStyle
                  rules={[{ required: true, message: 'Selecione o tipo de manejo.' }]}
                >
                  <Select
                    options={opcoesTipo}
                    placeholder="Selecione o tipo"
                    showSearch
                    optionFilterProp="label"
                    notFoundContent="Nenhum tipo cadastrado"
                  />
                </Form.Item>
                <Button icon={<SettingOutlined />} onClick={() => setTiposAberto(true)}>
                  Tipos
                </Button>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="descricao"
          label="Descrição"
          rules={[
            { required: true, whitespace: true, message: 'Informe a descrição da atividade.' },
            { max: 150, message: 'A descrição deve ter no máximo 150 caracteres.' },
          ]}
        >
          <Input placeholder="Ex.: Adubação de cobertura com NPK 20-05-20" />
        </Form.Item>

        <Form.Item
          name="talhaoIds"
          label="Talhões trabalhados"
          rules={[{ required: true, type: 'array', min: 1, message: 'Selecione pelo menos um talhão.' }]}
        >
          <Select
            mode="multiple"
            options={opcoesTalhao}
            placeholder={propriedadeId ? 'Selecione os talhões' : 'Selecione a safra primeiro'}
            disabled={!propriedadeId}
            optionFilterProp="label"
            notFoundContent="Nenhum talhão ativo nesta propriedade"
          />
        </Form.Item>

        <Divider titlePlacement="start">Planejamento e execução</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Selecione o status.' }]}>
              <Select options={OPCOES_STATUS_EDITAVEIS} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="dataPlanejada"
              label="Data planejada"
              dependencies={['status']}
              rules={[
                { required: true, message: 'Informe a data planejada.' },
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    if (!editando && getFieldValue('status') === 'Agendada' && valor && valor.isBefore(dayjs(), 'day')) {
                      return Promise.reject(new Error('A data planejada não pode ser anterior a hoje.'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                disabledDate={agendadaNova ? (dia) => dia && dia.isBefore(dayjs(), 'day') : undefined}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item
              name="dataConclusao"
              label="Data de conclusão"
              dependencies={['status']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    if (!valor && getFieldValue('status') === 'Concluida') {
                      return Promise.reject(new Error('Informe a data de conclusão.'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
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
          <Col xs={24} sm={12}>
            <Form.Item
              name="horasPrevistas"
              label="Horas previstas (opcional)"
              rules={[{ type: 'number', min: 0.01, message: 'As horas devem ser maiores que zero.' }]}
            >
              <InputNumber min={0} step={1} decimalSeparator="," suffix="h" placeholder="Ex.: 8" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="horasTrabalhadas"
              label="Horas trabalhadas (opcional)"
              rules={[{ type: 'number', min: 0.01, message: 'As horas devem ser maiores que zero.' }]}
            >
              <InputNumber min={0} step={1} decimalSeparator="," suffix="h" placeholder="Ex.: 7,5" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="observacao"
          label="Observação (opcional)"
          rules={[{ max: 250, message: 'A observação deve ter no máximo 250 caracteres.' }]}
        >
          <Input.TextArea rows={2} showCount maxLength={250} placeholder="Ex.: Aplicar após a chuva prevista para a semana" />
        </Form.Item>
      </Form>

      <TiposManejoModal
        aberto={tiposAberto}
        aoFechar={() => setTiposAberto(false)}
        aoAlterar={() => setVersaoTipos((v) => v + 1)}
      />
    </>
  );
}
