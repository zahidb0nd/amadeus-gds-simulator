import TerminalUI from './terminal-ui';

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const initialCommand = typeof searchParams.cmd === 'string' ? searchParams.cmd : '';

  return (
    <main>
      <TerminalUI initialCommand={initialCommand} />
    </main>
  );
}