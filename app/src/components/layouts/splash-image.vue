<template>
  <div class="flex min-h-full">
    <main
      class="flex flex-1 flex-col justify-center py-12 px-4
      sm:px-6 lg:flex-none lg:px-20 xl:px-24 shadow-2xl shadow-slate-500 z-10
      "
    >
      <slot />
    </main>

    <aside class="relative hidden w-0 flex-1 lg:block bg-slate-100">
      <slot name="image">
        <img
          class="absolute inset-0 h-full w-full object-cover opacity-60 "
          src="https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt=""
        >
      </slot>
    </aside>
  </div>
</template>

<script>
export default {
  name: 'SplashImageLayout',
};
</script>
