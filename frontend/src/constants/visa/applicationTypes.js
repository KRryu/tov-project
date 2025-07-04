/**
 * 비자 신청 타입 상수 정의
 * NEW, EXTENSION, CHANGE 타입 관리
 */

export const APPLICATION_TYPES = {
  NEW: {
    id: 'NEW',
    name: '신규',
    nameEn: 'New Application',
    description: '처음으로 해당 비자를 신청하는 경우',
    icon: 'plus-circle',
    color: 'blue'
  },
  EXTENSION: {
    id: 'EXTENSION',
    name: '연장',
    nameEn: 'Extension',
    description: '현재 비자의 체류기간을 연장하는 경우',
    icon: 'clock',
    color: 'green'
  },
  CHANGE: {
    id: 'CHANGE',
    name: '변경',
    nameEn: 'Change of Status',
    description: '다른 비자로 변경하는 경우',
    icon: 'swap',
    color: 'orange'
  }
};

export const APPLICATION_TYPE_LIST = Object.values(APPLICATION_TYPES);

export const getApplicationType = (id) => APPLICATION_TYPES[id];

export const isValidApplicationType = (id) => id in APPLICATION_TYPES;