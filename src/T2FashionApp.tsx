import T2FashionStory from './components/T2/T2FashionStory';

export default function T2FashionApp() {
  return (
    <T2FashionStory
      onExit={() => {
        window.location.hash = '';
        window.location.reload();
      }}
    />
  );
}
