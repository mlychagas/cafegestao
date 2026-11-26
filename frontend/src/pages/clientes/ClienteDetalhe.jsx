import { App, Breadcrumb, Button, Card, Descriptions, Flex, Result, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { inativarCliente, obterCliente, reativarCliente } from '../../api/clientesApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, textoOuTraco } from '../../utils/formatadores.js';
import { tipoDocumento } from '../../utils/documentos.js';
import { BotaoEditar, BotaoSituacao, BotaoVoltar } from '../../components/Botoes.jsx';
import { ClienteFormModal } from './ClienteFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_CLIENTE, CONSEQUENCIA_REATIVAR_CLIENTE } from './textosCliente.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function ClienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterCliente(id)
      .then((dados) => {
        if (!ignorar) {
          setCliente(dados);
          setErro(null);
        }
      })
      .catch((e) => {
        if (!ignorar) {
          setErro({ status: e.response?.status, mensagem: tratarErroApi(e) });
        }
      })
      .finally(() => {
        if (!ignorar) setCarregando(false);
      });

    return () => {
      ignorar = true;
    };
  }, [id, versao]);

  function recarregar() {
    setCarregando(true);
    setVersao((v) => v + 1);
  }

  function aposSalvar() {
    setModalAberto(false);
    recarregar();
  }

  async function alterarSituacao() {
    try {
      if (cliente.ativo) {
        await inativarCliente(cliente.id);
        message.success('Cliente inativado.');
      } else {
        await reativarCliente(cliente.id);
        message.success('Cliente reativado.');
      }
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  if (carregando && !cliente) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !cliente) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Cliente não encontrado' : 'Não foi possível carregar o cliente'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/clientes')}>Voltar para a lista</Button>
            {erro.status !== 404 && (
              <Button type="primary" onClick={recarregar}>
                Tentar novamente
              </Button>
            )}
          </Flex>
        }
      />
    );
  }

  const { endereco } = cliente;

  const itensDados = [
    { key: 'documento', label: tipoDocumento(cliente.cpfCnpj), children: cliente.cpfCnpj },
    { key: 'telefone', label: 'Telefone', children: cliente.telefone },
    { key: 'celular', label: 'Celular', children: textoOuTraco(cliente.celular) },
    { key: 'email', label: 'E-mail', children: cliente.email },
    { key: 'cadastro', label: 'Cadastrado em', children: formatarData(cliente.dataCriacao) },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(cliente.dataAtualizacao) },
  ];

  const itensEndereco = [
    { key: 'cep', label: 'CEP', children: endereco.cep },
    { key: 'rua', label: 'Rua', children: endereco.rua },
    { key: 'numero', label: 'Número', children: endereco.numero },
    { key: 'bairro', label: 'Bairro', children: endereco.bairro },
    { key: 'cidade', label: 'Cidade', children: endereco.cidade },
    { key: 'uf', label: 'Estado (UF)', children: endereco.uf },
    { key: 'pais', label: 'País', children: textoOuTraco(endereco.pais) },
    { key: 'complemento', label: 'Complemento', children: textoOuTraco(endereco.complemento) },
  ];

  return (
    <Spin spinning={carregando}>
      <BotaoVoltar onClick={() => navigate('/clientes')}>Voltar para Clientes</BotaoVoltar>

      <Breadcrumb
        items={[
          { title: 'Comercial' },
          { title: <Link to="/clientes">Clientes</Link> },
          { title: cliente.nome },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {cliente.nome}
            </Typography.Title>
            {cliente.ativo ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>}
          </Flex>
          <Typography.Text type="secondary">
            {endereco.cidade} / {endereco.uf}
          </Typography.Text>
        </div>

        <Flex gap={8} wrap>
          <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
          <BotaoSituacao
            naTabela={false}
            ativo={cliente.ativo}
            nomeItem="este cliente"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_CLIENTE}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_CLIENTE}
            onConfirmar={alterarSituacao}
          />
        </Flex>
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados do cliente">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title="Endereço">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensEndereco} />
        </Card>
      </Flex>

      <ClienteFormModal
        aberto={modalAberto}
        cliente={cliente}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}
