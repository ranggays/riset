import { Loader, Center, Box, Text, Stack } from '@mantine/core';

export default function Loading(){
    return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url('/webp/login-background.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Center>
        <Stack align="center" gap="md">
          <Loader size="lg" color="white" />
          <Text c="white" fw={600}>Memuat...</Text>
        </Stack>
      </Center>
    </Box>
  );
}