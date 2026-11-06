import { App, Breadcrumb, Button, Card, Descriptions, Empty, Flex, Result, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { inativarFornecedor, obterFornecedor, reativarFornecedor } from '../../api/fornecedoresApi.js';
import { tratarErroApi } from '../../utils/tratarErroApi.js';
import { formatarData, textoOuTraco } from '../../utils/formatadores.js';
import { tipoDocumento } from '../../utils/documentos.js';
import { BotaoEditar, BotaoSituacao, BotaoVoltar } from '../../components/Botoes.jsx';
import { FornecedorFormModal } from './FornecedorFormModal.jsx';
import { CONSEQUENCIA_INATIVAR_FORNECEDOR, CONSEQUENCIA_REATIVAR_FORNECEDOR } from './textosFornecedor.js';

const COLUNAS_DESCRICAO = { xs: 1, sm: 2, lg: 3 };

export function FornecedorDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [fornecedor, setFornecedor] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ignorar = false;

    obterFornecedor(id)
      .then((dados) => {
        if (!ignorar) {
          setFornecedor(dados);
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
      if (fornecedor.ativo) {
        await inativarFornecedor(fornecedor.id);
        message.success('Fornecedor inativado.');
      } else {
        await reativarFornecedor(fornecedor.id);
        message.success('Fornecedor reativado.');
      }
      recarregar();
    } catch (e) {
      message.error(tratarErroApi(e));
    }
  }

  if (carregando && !fornecedor) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (erro && !fornecedor) {
    return (
      <Result
        status={erro.status === 404 ? '404' : 'error'}
        title={erro.status === 404 ? 'Fornecedor não encontrado' : 'Não foi possível carregar o fornecedor'}
        subTitle={erro.mensagem}
        extra={
          <Flex justify="center" gap={8}>
            <Button onClick={() => navigate('/fornecedores')}>Voltar para a lista</Button>
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

  const { endereco } = fornecedor;

  const itensDados = [
    { key: 'documento', label: tipoDocumento(fornecedor.cpfCnpj), children: fornecedor.cpfCnpj },
    { key: 'telefone', label: 'Telefone', children: fornecedor.telefone },
    { key: 'celular', label: 'Celular', children: textoOuTraco(fornecedor.celular) },
    { key: 'email', label: 'E-mail', children: fornecedor.email },
    { key: 'cadastro', label: 'Cadastrado em', children: formatarData(fornecedor.dataCriacao) },
    { key: 'atualizacao', label: 'Última atualização', children: formatarData(fornecedor.dataAtualizacao) },
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
      <BotaoVoltar onClick={() => navigate('/fornecedores')}>Voltar para Fornecedores</BotaoVoltar>

      <Breadcrumb
        items={[
          { title: 'Suprimentos' },
          { title: <Link to="/fornecedores">Fornecedores</Link> },
          { title: fornecedor.razaoSocial },
        ]}
        style={{ margin: '6px 0' }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 22 }}>
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {fornecedor.razaoSocial}
            </Typography.Title>
            {fornecedor.ativo ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>}
          </Flex>
          <Typography.Text type="secondary">
            {endereco.cidade} / {endereco.uf}
          </Typography.Text>
        </div>

        <Flex gap={8} wrap>
          <BotaoEditar naTabela={false} onClick={() => setModalAberto(true)} />
          <BotaoSituacao
            naTabela={false}
            ativo={fornecedor.ativo}
            nomeItem="este fornecedor"
            consequenciaInativar={CONSEQUENCIA_INATIVAR_FORNECEDOR}
            consequenciaReativar={CONSEQUENCIA_REATIVAR_FORNECEDOR}
            onConfirmar={alterarSituacao}
          />
        </Flex>
      </Flex>

      <Flex vertical gap={16}>
        <Card title="Dados do fornecedor">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensDados} />
        </Card>

        <Card title="Endereço">
          <Descriptions column={COLUNAS_DESCRICAO} items={itensEndereco} />
        </Card>

        <Card title="Compras">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              fornecedor.quantidadeCompras > 0
                ? `${fornecedor.quantidadeCompras} compra(s) registrada(s) com este fornecedor.`
                : 'Nenhuma compra registrada com este fornecedor.'
            }
          />
        </Card>
      </Flex>

      <FornecedorFormModal
        aberto={modalAberto}
        fornecedor={fornecedor}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={aposSalvar}
      />
    </Spin>
  );
}
