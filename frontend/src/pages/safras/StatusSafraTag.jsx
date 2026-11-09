import { Tag } from 'antd';
import { STATUS_SAFRA } from './opcoesSafra.js';

export function StatusSafraTag({ status }) {
  const info = STATUS_SAFRA[status];
  if (!info) return null;
  return <Tag color={info.cor}>{info.rotulo}</Tag>;
}
