import { Ref } from 'effect';
import { produce } from 'immer';

export function updateRef<T>(ref: Ref.Ref<T>, modifier: (draft: T) => void) {
  return Ref.update(ref, value => produce(value, modifier));
}
