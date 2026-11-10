import { HomeOutlined, EnvironmentOutlined, CalendarOutlined, ToolOutlined, ShopOutlined, ShoppingCartOutlined, ExperimentOutlined } from '@ant-design/icons';

const menuItens = [
  {
    type: 'group',
    label: 'Visão Geral',
    children: [
      { key: '/', icon: <HomeOutlined />, label: 'Home' },
    ],
  },
  {
    type: 'group',
    label: 'Planejamento',
    children: [
      { key: '/propriedades', icon: <EnvironmentOutlined />, label: 'Propriedades Rurais' },
      { key: '/safras', icon: <CalendarOutlined />, label: 'Safras' },
      { key: '/atividades-manejo', icon: <ToolOutlined />, label: 'Atividades de Manejo' },
    ],
  },
  {
    type: 'group',
    label: 'Suprimentos',
    children: [
      { key: '/fornecedores', icon: <ShopOutlined />, label: 'Fornecedores' },
      { key: '/compras', icon: <ShoppingCartOutlined />, label: 'Compras' },
      { key: '/insumos', icon: <ExperimentOutlined />, label: 'Insumos' },
    ],
  },
];

export default menuItens;