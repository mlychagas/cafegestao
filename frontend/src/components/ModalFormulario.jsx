import { Modal } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';

export function ModalFormulario({ titulo, aberto, salvando, idFormulario, aoCancelar, largura = 520, children }) {
  return (
    <Modal
      title={titulo}
      open={aberto}
      onCancel={aoCancelar}
      okText="Salvar"
      cancelText="Cancelar"
      okButtonProps={{ icon: <SaveOutlined />, htmlType: 'submit', form: idFormulario }}
      closable={{ closeIcon: <CloseOutlined />, 'aria-label': 'Fechar' }}
      mask={{ closable: false }}
      confirmLoading={salvando}
      width={largura}
      destroyOnHidden
    >
      {children}
    </Modal>
  );
}