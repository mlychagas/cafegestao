import { HomeOutlined, EnvironmentOutlined, CalendarOutlined, ToolOutlined, TeamOutlined, ScissorOutlined, InboxOutlined, ShopOutlined, ShoppingCartOutlined, ExperimentOutlined, SolutionOutlined } from '@ant-design/icons';

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
      { key: '/pessoas', icon: <TeamOutlined />, label: 'Pessoas' },
    ],
  },
  {
    type: 'group',
    label: 'Produção',
    children: [
      { key: '/colheitas', icon: <ScissorOutlined />, label: 'Colheitas' },
      { key: '/lotes', icon: <InboxOutlined />, label: 'Lotes de café' },
    ],
  },
  {
    type: 'group',
    label: 'Comercial',
    children: [
      { key: '/clientes', icon: <SolutionOutlined />, label: 'Clientes' },
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