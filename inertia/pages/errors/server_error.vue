<script setup lang="ts">
import { SearchIcon } from '@lucide/vue'
import { Link } from '@adonisjs/inertia/vue'
</script>

<template>
  <div class="flex flex-col w-full items-center justify-center min-h-screen">
    <div class="mx-auto">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>500 - Server Error</EmptyTitle>
          <EmptyDescription> Something went wrong. Please try again later. </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup class="sm:w-3/4">
            <InputGroupInput placeholder="Try searching for pages..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <EmptyDescription>
            Need help? <Link href="/contact">Contact support</Link>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  </div>
</template>
