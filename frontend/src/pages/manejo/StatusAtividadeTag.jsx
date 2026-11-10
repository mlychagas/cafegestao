import { Tag } from 'antd';
import { STATUS_ATIVIDADE } from './opcoesAtividade.js';

export function StatusAtividadeTag({ status }) {
  const info = STATUS_ATIVIDADE[status];
  if (!info) return null;
  return <Tag color={info.cor}>{info.rotulo}</Tag>;
}
