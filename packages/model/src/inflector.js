import infl from 'inflected';
import { ucFirst } from '@parameter1/utils';
import is from '@sindresorhus/is';

const classify = (value) => infl.classify(infl.underscore(value));

export default {
  classify: (value) => {
    if (!is.string(value)) throw new Error('The value must be a string');
    const parts = value.trim().split(' ');
    if (parts.length === 1) return classify(parts[0]);
    const cleaned = parts
      .map((p) => p.trim())
      .filter((p) => p)
      .map((p) => ucFirst(p.toLowerCase()))
      .join('');
    return classify(cleaned);
  },
};
