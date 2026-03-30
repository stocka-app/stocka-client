import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateComposition } from '../StateComposition';

describe('Given StateComposition renders a centered state screen', () => {
  describe('When rendered with required props and neutral variant', () => {
    it('Then it renders the title and description', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="No storages"
          description="Create your first storage to get started."
        />,
      );
      expect(screen.getByText('No storages')).toBeInTheDocument();
      expect(screen.getByText('Create your first storage to get started.')).toBeInTheDocument();
    });

    it('Then it renders a status role element', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
        />,
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('When rendered with the danger variant', () => {
    it('Then it renders successfully with danger styling', () => {
      render(
        <StateComposition
          icon="error"
          variant="danger"
          title="Error occurred"
          description="Something went wrong."
        />,
      );
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });

  describe('When rendered with the search variant', () => {
    it('Then it renders successfully with search styling', () => {
      render(
        <StateComposition
          icon="search_off"
          variant="search"
          title="No results"
          description="Try a different search term."
        />,
      );
      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });

  describe('When actions are provided', () => {
    it('Then it renders the actions slot', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
          actions={<button type="button">Create</button>}
        />,
      );
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
  });

  describe('When actions are not provided', () => {
    it('Then no actions section is rendered', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
        />,
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('When cards are provided', () => {
    it('Then it renders all info cards', () => {
      const cards = [
        { icon: 'warehouse', iconColor: 'text-blue-500', title: 'Warehouses', description: 'Large spaces' },
        { icon: 'inventory_2', iconColor: 'text-green-500', title: 'Store Rooms', description: 'Medium spaces' },
      ];
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
          cards={cards}
        />,
      );
      expect(screen.getByText('Warehouses')).toBeInTheDocument();
      expect(screen.getByText('Large spaces')).toBeInTheDocument();
      expect(screen.getByText('Store Rooms')).toBeInTheDocument();
      expect(screen.getByText('Medium spaces')).toBeInTheDocument();
    });
  });

  describe('When cards is an empty array', () => {
    it('Then no cards section is rendered', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
          cards={[]}
        />,
      );
      // Only the title/description are rendered, no card titles
      expect(screen.queryByText('Warehouses')).not.toBeInTheDocument();
    });
  });

  describe('When className is provided', () => {
    it('Then the className is applied to the root element', () => {
      render(
        <StateComposition
          icon="inventory_2"
          variant="neutral"
          title="Empty"
          description="Nothing here."
          className="my-custom-class"
        />,
      );
      expect(screen.getByRole('status')).toHaveClass('my-custom-class');
    });
  });
});
