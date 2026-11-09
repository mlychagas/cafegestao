import { Alert, App, Button, Flex, Form, Input, Modal, Space, Table, Tooltip, Typography } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  atualizarTipoManejo,
  cadastrarTipoManejo,
  excluirTipoManejo,
  listarTiposManejo,
} from '../../api/tiposManejoApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { aplicarErrosNoFormulario } from '../../utils/errosFormulario.js';
import { textoOuTraco } from '../../utils/formatadores.js';
import { BotaoEditar, BotaoExcluir, BotaoNovo } from '../../components/Botoes.jsx';

const CONSEQUENCIA_EXCLUIR_TIPO = 'O tipo de manejo será removido definitivamente.';

export function TiposManejoModal({ aberto, aoFechar, aoAlterar }) {
  return (
    <Modal
      title="Tipos de manejo"
      open={aberto}
      onCancel={aoFechar}
      footer={<Button onClick={aoFechar}>Fechar</Button>}
      closable={{ closeIcon: <CloseOutlined />, 'aria-label': 'Fechar' }}
      mask={{ closable: false }}
      width={760}
      destroyOnHidden
    >
      <GerenciadorTiposManejo aoAlterar={aoAlterar} />
    </Modal>
  );
}

function GerenciadorTiposManejo({ aoAlterar }) {
  const { message } = App.useApp();

  const [tipos, setTipos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [versao, setVersao] = useState(0);
  const [emEdicao, setEmEdicao] = useState(undefined);

  useEffect(() => {
    let ignorar = false;

    listarTiposManejo()
      .then((dados) => {
        if (!ignorar) {
          setTipos(dados);
          setErroLista(null);
        }
      })
      .catch((erro) => {
        if (!ignorar) setErroLista(tratarErroApi(erro));
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });

    return () => {
      ignorar = true;
    };
  }, [versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aposSalvar() {
    setEmEdicao(undefined);
    recarregar();
    aoAlterar?.();
  }

  async function excluir(registro) {
    try {
      await excluirTipoManejo(registro.id);
      message.success('Tipo de manejo excluído.');
      recarregar();
      aoAlterar?.();
    } catch (erro) {
      message.error(tratarErroApi(erro));
    }
  }

  if (emEdicao !== undefined) {
    return <FormularioTipoManejo tipo={emEdicao} aoCancelar={() => setEmEdicao(undefined)} aoSalvar={aposSalvar} />;
  }

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      ellipsis: true,
      render: textoOuTraco,
    },
    {
      title: 'Em uso',
      dataIndex: 'quantidadeAtividades',
      key: 'quantidadeAtividades',
      render: (quantidade) => (quantidade > 0 ? `${quantidade} atividade(s)` : '—'),
    },
    {
      key: 'acoes',
      align: 'right',
      render: (_, registro) => {
        const emUso = registro.quantidadeAtividades > 0;
        const botaoExcluir = (
          <BotaoExcluir
            nomeItem="este tipo de manejo"
            consequencia={CONSEQUENCIA_EXCLUIR_TIPO}
            onConfirmar={() => excluir(registro)}
            desabilitado={emUso}
          />
        );

        return (
          <Space size={0}>
            <BotaoEditar onClick={() => setEmEdicao(registro)} />
            {emUso ? (
              <Tooltip title="Não pode ser excluído porque está vinculado a atividades de manejo.">
                <span>{botaoExcluir}</span>
              </Tooltip>
            ) : (
              botaoExcluir
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Cadastre os tipos usados nas atividades (ex.: adubação, poda, pulverização, colheita).
        </Typography.Text>
        <BotaoNovo onClick={() => setEmEdicao(null)}>Novo tipo</BotaoNovo>
      </Flex>

      {erroLista && (
        <Alert
          type="error"
          showIcon
          title={erroLista}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={recarregar}>
              Tentar novamente
            </Button>
          }
        />
      )}

      <Table
        rowKey="id"
        size="small"
        columns={colunas}
        dataSource={tipos}
        loading={carregando}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'Nenhum tipo de manejo cadastrado.' }}
      />
    </>
  );
}

function FormularioTipoManejo({ tipo, aoCancelar, aoSalvar }) {
  const [form] = Form.useForm();
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);
  const { message } = App.useApp();

  const editando = Boolean(tipo);

  async function aoEnviar(valores) {
    setMensagemErro(null);
    setSalvando(true);

    const dados = { nome: valores.nome, descricao: valores.descricao || null };

    try {
      if (editando) {
        await atualizarTipoManejo(tipo.id, dados);
        message.success('Tipo de manejo atualizado com sucesso.');
      } else {
        await cadastrarTipoManejo(dados);
        message.success('Tipo de manejo cadastrado com sucesso.');
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
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        {editando ? 'Editar tipo de manejo' : 'Novo tipo de manejo'}
      </Typography.Title>

      {mensagemErro && (
        <Alert type="error" showIcon title={mensagemErro} style={{ marginBottom: 16 }} />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={tipo ? { nome: tipo.nome, descricao: tipo.descricao } : {}}
        onFinish={aoEnviar}
        onValuesChange={() => setMensagemErro(null)}
      >
        <Form.Item
          name="nome"
          label="Nome"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome do tipo de manejo.' },
            { max: 50, message: 'O nome deve ter no máximo 50 caracteres.' },
          ]}
        >
          <Input autoFocus placeholder="Ex.: Adubação de cobertura" />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Descrição (opcional)"
          rules={[{ max: 150, message: 'A descrição deve ter no máximo 150 caracteres.' }]}
        >
          <Input.TextArea rows={3} showCount maxLength={150} placeholder="Ex.: Aplicação de NPK após as chuvas" />
        </Form.Item>

        <Flex justify="flex-end" gap={8}>
          <Button onClick={aoCancelar}>Cancelar</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={salvando}>
            Salvar
          </Button>
        </Flex>
      </Form>
    </>
  );
}
