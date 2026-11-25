import { Alert, App, AutoComplete, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { atualizarColheita, cadastrarColheita } from '../../api/colheitasApi.js';
import { listarAtividadesManejo, obterAtividadeManejo } from '../../api/atividadesManejoApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { formatarArea, formatarData } from '../../utils/formatadores.js';
import { ModalFormulario } from '../../components/ModalFormulario.jsx';
import { rotuloSafra } from '../manejo/opcoesAtividade.js';
import {
  OPCOES_UNIDADE_COLHEITA,
  STATUS_ATIVIDADE_COM_COLHEITA,
  SUGESTOES_FORMA_COLHEITA,
  siglaUnidadeColheita,
} from './opcoesColheita.js';

const ID_FORMULARIO = 'formulario-colheita';

function montarValoresIniciais(colheita) {
  if (!colheita) return { dataInicio: dayjs(), talhaoIds: [] };

  return {
    dataInicio: dayjs(colheita.dataInicio),
    dataFim: colheita.dataFim ? dayjs(colheita.dataFim) : null,
    quantidade: colheita.quantidade,
    unidadeMedida: colheita.unidadeMedida,
    formaColheita: colheita.formaColheita,
    observacao: colheita.observacao,
    talhaoIds: colheita.talhoes.map((t) => t.id),
  };
}

function montarDadosEnvio(valores) {
  return {
    dataInicio: valores.dataInicio.format('YYYY-MM-DD'),
    dataFim: valores.dataFim ? valores.dataFim.format('YYYY-MM-DD') : null,
    quantidade: valores.quantidade,
    unidadeMedida: valores.unidadeMedida,
    formaColheita: valores.formaColheita?.trim() || null,
    observacao: valores.observacao?.trim() || null,
    talhaoIds: valores.talhaoIds,
  };
}

function depoisDeHoje(dia) {
  return dia && dia > dayjs().endOf('day');
}

export function ColheitaFormModal({ aberto, colheita, safras = [], aoFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(colheita);

  return (
    <ModalFormulario
      titulo={editando ? 'Editar colheita' : 'Nova colheita'}
      aberto={aberto}
      salvando={salvando}
      idFormulario={ID_FORMULARIO}
      aoCancelar={aoFechar}
      largura={760}
    >
      <FormularioColheita colheita={colheita} safras={safras} setSalvando={setSalvando} aoSalvar={aoSalvar} />
    </ModalFormulario>
  );
}

function FormularioColheita({ colheita, safras, setSalvando, aoSalvar }) {
  const [form] = Form.useForm();
  const [mensagemErro, setMensagemErro] = useState(null);
  const [atividadesCarregadas, setAtividadesCarregadas] = useState({ safraId: null, lista: [] });
  const [talhoesAtividadeEditada, setTalhoesAtividadeEditada] = useState([]);
  const { message, modal } = App.useApp();

  const editando = Boolean(colheita);
  const safraSelecionada = Form.useWatch('safraId', form);
  const atividadeSelecionada = Form.useWatch('atividadeManejoId', form);
  const unidadeSelecionada = Form.useWatch('unidadeMedida', form);

  useEffect(() => {
    if (editando || !safraSelecionada) return undefined;

    let ignorar = false;

    listarAtividadesManejo({ safraId: safraSelecionada })
      .then((dados) => {
        if (!ignorar) setAtividadesCarregadas({ safraId: safraSelecionada, lista: dados });
      })
      .catch((erro) => {
        if (!ignorar) setMensagemErro(tratarErroApi(erro));
      });

    return () => {
      ignorar = true;
    };
  }, [editando, safraSelecionada]);

  useEffect(() => {
    if (!editando) return undefined;

    let ignorar = false;

    obterAtividadeManejo(colheita.atividadeManejoId)
      .then((dados) => {
        if (!ignorar) setTalhoesAtividadeEditada(dados.talhoes);
      })
      .catch((erro) => {
        if (!ignorar) setMensagemErro(tratarErroApi(erro));
      });

    return () => {
      ignorar = true;
    };
  }, [editando, colheita]);

  const opcoesSafra = safras
    .filter((s) => s.status !== 'Encerrada')
    .map((s) => ({ value: s.id, label: rotuloSafra(s) }));

  const atividadesDaSafra = atividadesCarregadas.safraId === safraSelecionada ? atividadesCarregadas.lista : [];
  const atividadesDisponiveis = atividadesDaSafra.filter((a) => STATUS_ATIVIDADE_COM_COLHEITA.includes(a.status));
  const opcoesAtividade = atividadesDisponiveis.map((a) => ({
    value: a.id,
    label: `${a.descricao} · ${formatarData(a.dataPlanejada)}`,
  }));

  const talhoesDisponiveis = editando
    ? talhoesAtividadeEditada
    : (atividadesDisponiveis.find((a) => a.id === atividadeSelecionada)?.talhoes ?? []);
  const opcoesTalhao = talhoesDisponiveis.map((t) => ({ value: t.id, label: `${t.nome} (${formatarArea(t.areaHa)})` }));

  function aoMudarValores(alterados) {
    setMensagemErro(null);

    if ('safraId' in alterados) {
      form.setFieldsValue({ atividadeManejoId: undefined, talhaoIds: [] });
    }

    if ('atividadeManejoId' in alterados) {
      const atividade = atividadesDisponiveis.find((a) => a.id === alterados.atividadeManejoId);
      form.setFieldValue('talhaoIds', atividade ? atividade.talhoes.map((t) => t.id) : []);
    }
  }

  async function salvar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = montarDadosEnvio(valores);

    try {
      if (editando) {
        await atualizarColheita(colheita.id, dados);
        message.success('Colheita atualizada com sucesso.');
      } else {
        await cadastrarColheita({ ...dados, atividadeManejoId: valores.atividadeManejoId });
        message.success('Colheita cadastrada com sucesso.');
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
      title: 'Salvar as alterações da colheita?',
      content: 'Os dados atuais da colheita serão substituídos pelos novos.',
      okText: 'Salvar',
      cancelText: 'Cancelar',
      onOk: () => salvar(valores),
    });
  }

  const semAtividades = !editando && safraSelecionada && atividadesCarregadas.safraId === safraSelecionada && opcoesAtividade.length === 0;

  return (
    <>
      {mensagemErro && <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />}

      <Form
        id={ID_FORMULARIO}
        form={form}
        layout="vertical"
        initialValues={montarValoresIniciais(colheita)}
        onFinish={aoEnviar}
        onValuesChange={aoMudarValores}
      >
        <Divider titlePlacement="start" style={{ marginTop: 0 }}>
          Origem
        </Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            {editando ? (
              <Form.Item label="Safra">
                <Input value={`${colheita.anoAgricolaSafra} · ${colheita.nomePropriedade}`} disabled />
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
            {editando ? (
              <Form.Item label="Atividade de manejo">
                <Input value={colheita.descricaoAtividade} disabled />
              </Form.Item>
            ) : (
              <Form.Item
                name="atividadeManejoId"
                label="Atividade de manejo"
                rules={[{ required: true, message: 'Selecione a atividade de manejo.' }]}
              >
                <Select
                  options={opcoesAtividade}
                  placeholder={safraSelecionada ? 'Selecione a atividade' : 'Selecione a safra primeiro'}
                  disabled={!safraSelecionada}
                  showSearch
                  optionFilterProp="label"
                  notFoundContent="Nenhuma atividade disponível nesta safra"
                />
              </Form.Item>
            )}
          </Col>
        </Row>

        {semAtividades && (
          <Alert
            type="info"
            showIcon
            title="Nenhuma atividade disponível nesta safra."
            description="A colheita precisa de uma atividade de manejo em andamento ou concluída."
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="talhaoIds"
          label="Talhões colhidos"
          rules={[{ required: true, type: 'array', min: 1, message: 'Selecione pelo menos um talhão.' }]}
        >
          <Select
            mode="multiple"
            options={opcoesTalhao}
            placeholder={editando || atividadeSelecionada ? 'Selecione os talhões' : 'Selecione a atividade primeiro'}
            disabled={!editando && !atividadeSelecionada}
            optionFilterProp="label"
            notFoundContent="A atividade não tem talhões"
          />
        </Form.Item>

        <Divider titlePlacement="start">Colheita</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="dataInicio"
              label="Data de início"
              rules={[{ required: true, message: 'Informe a data de início.' }]}
            >
              <DatePicker format="DD/MM/YYYY" disabledDate={depoisDeHoje} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="dataFim"
              label="Data de fim (opcional)"
              dependencies={['dataInicio']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, valor) {
                    const inicio = getFieldValue('dataInicio');
                    if (valor && inicio && valor.isBefore(inicio, 'day')) {
                      return Promise.reject(new Error('A data de fim não pode ser anterior à data de início.'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker format="DD/MM/YYYY" disabledDate={depoisDeHoje} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="quantidade"
              label="Quantidade colhida"
              rules={[
                { required: true, message: 'Informe a quantidade.' },
                { type: 'number', min: 0.001, message: 'A quantidade deve ser maior que zero.' },
              ]}
            >
              <InputNumber
                min={0}
                step={1}
                decimalSeparator=","
                suffix={siglaUnidadeColheita(unidadeSelecionada) || undefined}
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
              name="formaColheita"
              label="Forma de colheita (opcional)"
              rules={[{ max: 50, message: 'Máximo de 50 caracteres.' }]}
            >
              <AutoComplete options={SUGESTOES_FORMA_COLHEITA} placeholder="Ex.: Manual" />
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
