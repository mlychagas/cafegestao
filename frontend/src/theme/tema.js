export const CORES = {
  verdeEscuro: '#2F5233',
  marromEscuro: '#4A2E1B',
  marromMedio: '#6B4226',
  alerta: '#A65D56',
  texto: '#333333',
  textoSecundario: '#6B6B6B',
  borda: '#E0DCD5',
  fundo: '#F7F5F2',
  branco: '#FFFFFF',
  textoMenu: '#EFE6DC',
  tituloGrupoMenu: '#C9BBAC',
};

const tema = {
  token: {
    colorPrimary: CORES.verdeEscuro,
    borderRadius: 8,
    colorError: CORES.alerta,
    colorLink: CORES.marromMedio,
    colorText: CORES.texto,
    colorTextSecondary: CORES.textoSecundario,
    colorBorder: CORES.borda,
    colorBgLayout: CORES.fundo,
    fontFamily: "'Manrope', sans-serif",
  },
  components: {
    Layout: {
      siderBg: CORES.marromEscuro,
      headerBg: CORES.branco,
      bodyBg: CORES.fundo,
    },
    Menu: {
      darkItemBg: CORES.marromEscuro,
      darkItemColor: CORES.textoMenu,
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemSelectedBg: 'rgba(127,166,113,0.18)',
      darkItemSelectedColor: CORES.branco,
      darkGroupTitleColor: CORES.tituloGrupoMenu,
    },
    Modal: {
      titleColor: CORES.marromEscuro,
    },
    Card: {
      colorTextHeading: CORES.marromEscuro,
    },
    Divider: {
      colorTextHeading: CORES.marromEscuro,
    },
  },
};

export default tema;