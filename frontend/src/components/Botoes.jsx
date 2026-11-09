import { Button, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons';

export function BotaoNovo({ onClick, desabilitado = false, children = 'Novo' }) {
  return (
    <Button type="primary" icon={<PlusOutlined />} onClick={onClick} disabled={desabilitado}>
      {children}
    </Button>
  );
}

export function BotaoVoltar({ onClick, children }) {
  return (
    <Button type="link" icon={<ArrowLeftOutlined />} onClick={onClick} style={{ paddingInline: 0 }}>
      {children}
    </Button>
  );
}

export function BotaoVer({ onClick }) {
  return (
    <Button type="link" icon={<EyeOutlined />} onClick={onClick}>
      Ver
    </Button>
  );
}

export function BotaoEditar({ onClick, naTabela = true }) {
  return (
    <Button type={naTabela ? 'link' : 'default'} icon={<EditOutlined />} onClick={onClick}>
      Editar
    </Button>
  );
}

export function BotaoSituacao({
  ativo,
  nomeItem,
  consequenciaInativar,
  consequenciaReativar,
  onConfirmar,
  naTabela = true,
}) {
  return (
    <Popconfirm
      title={ativo ? `Inativar ${nomeItem}?` : `Reativar ${nomeItem}?`}
      description={ativo ? consequenciaInativar : consequenciaReativar}
      okText={ativo ? 'Inativar' : 'Reativar'}
      cancelText="Cancelar"
      okButtonProps={{ danger: ativo }}
      onConfirm={onConfirmar}
    >
      <Button
        type={naTabela ? 'link' : 'default'}
        danger={ativo}
        icon={ativo ? <StopOutlined /> : <CheckCircleOutlined />}
      >
        {ativo ? 'Inativar' : 'Reativar'}
      </Button>
    </Popconfirm>
  );
}

export function BotaoExcluir({ nomeItem, consequencia, onConfirmar, naTabela = true }) {
  return (
    <Popconfirm
      title={`Excluir ${nomeItem}?`}
      description={consequencia}
      okText="Excluir"
      cancelText="Cancelar"
      okButtonProps={{ danger: true }}
      onConfirm={onConfirmar}
    >
      <Button type={naTabela ? 'link' : 'default'} danger icon={<DeleteOutlined />}>
        Excluir
      </Button>
    </Popconfirm>
  );
}
