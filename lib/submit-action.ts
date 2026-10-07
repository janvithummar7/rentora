import { startTransition, type FormEvent } from "react";

/**
 * Submit handler for `useActionState` forms. Passing the action through a transition (instead of
 * `<form action>`) stops React 19 from resetting the fields after the action runs, so users keep
 * what they typed after a validation error and see saved values after saving.
 * Use together with `<form action={action}>` so the form still works if submitted before hydration
 * (React skips the action when this handler calls preventDefault).
 */
export function submitAction(action: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Pass the submitter so the clicked button's name/value (e.g. status buttons) is included.
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(formData));
  };
}
