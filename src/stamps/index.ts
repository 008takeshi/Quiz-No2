import bakushoImg from './stamp_bakusho.png';
import bombImg from './stamp_bomb.png';
import brokenHeartImg from './stamp_broken_heart.png';
import btnAImg from './stamp_btn_a.png';
import btnBImg from './stamp_btn_b.png';
import btnCImg from './stamp_btn_c.png';
import btnDImg from './stamp_btn_d.png';
import clapImg from './stamp_clap.png';
import faceBlankImg from './stamp_face_blank.png';
// import faceCryImg from './stamp_face_cry.png';
import faceSobImg from './stamp_face_sob.png';
// import ghostImg from './stamp_ghost.png';
import heartImg from './stamp_heart.png';
import noImg from './stamp_no.png';
import okImg from './stamp_ok.png';
import skullImg from './stamp_skull.png';
import thumbsdownBadImg from './stamp_thumbsdown_bad.png';
import thumbsupImg from './stamp_thumbsup.png';
import winImg from './stamp_win.png';

export interface StampDef {
  id: string;
  label: string;
  src: string;
}

export const STAMPS: StampDef[] = [
  { id: 'stamp_heart',         label: 'ハート',       src: heartImg },
  { id: 'stamp_broken_heart',  label: 'ハートブレイク', src: brokenHeartImg },
  { id: 'stamp_thumbsup',      label: 'いいね',       src: thumbsupImg },
  { id: 'stamp_thumbsdown_bad',label: 'ダメ',         src: thumbsdownBadImg },
  { id: 'stamp_clap',          label: '拍手',         src: clapImg },
  { id: 'stamp_win',           label: 'やった！',     src: winImg },
  { id: 'stamp_ok',            label: 'OK',           src: okImg },
  { id: 'stamp_no',            label: 'ノー',         src: noImg },
  { id: 'stamp_bakusho',       label: '爆笑',         src: bakushoImg },
  // { id: 'stamp_face_cry',      label: 'なき',         src: faceCryImg },
  { id: 'stamp_face_sob',      label: 'おお泣き',     src: faceSobImg },
  { id: 'stamp_face_blank',    label: 'ぽかん',       src: faceBlankImg },
  // { id: 'stamp_ghost',         label: 'おばけ',       src: ghostImg },
  { id: 'stamp_skull',         label: 'どくろ',       src: skullImg },
  { id: 'stamp_bomb',          label: 'ばくだん',     src: bombImg },
  { id: 'stamp_btn_a',         label: 'A',            src: btnAImg },
  { id: 'stamp_btn_b',         label: 'B',            src: btnBImg },
  { id: 'stamp_btn_c',         label: 'C',            src: btnCImg },
  { id: 'stamp_btn_d',         label: 'D',            src: btnDImg },
];

export const STAMP_MAP = new Map<string, StampDef>(
  STAMPS.map(s => [s.id, s])
);
