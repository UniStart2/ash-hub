import { ref } from 'vue';

export type ToastType = 'ok' | 'warn' | 'info';

export type TimerHandle = ReturnType<typeof setTimeout>;

const visible = ref(false);
const message = ref('');
const type = ref<ToastType>('ok');
let timer: TimerHandle | undefined;

export function toast(msg: string, t: ToastType = 'ok') {
  message.value = msg;
  type.value = t;
  visible.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = false;
  }, 1900);
}

export function useToast() {
  return { visible, message, type };
}

export async function copyText(text: string, successMsg = '已复制') {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  toast(successMsg, 'ok');
}
