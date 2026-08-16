import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LangLayout } from '@/layouts/LangLayout';
import { DEFAULT_LANGUAGE } from '@/i18n';
import { HomePage } from '@/pages/HomePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { CollectionDetailPage } from '@/pages/CollectionDetailPage';
import { ColorsPage } from '@/pages/ColorsPage';
import { ColorDetailPage } from '@/pages/ColorDetailPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { CraftsmanshipPage } from '@/pages/CraftsmanshipPage';
import { OurCraftPage } from '@/pages/OurCraftPage';
import { ProfessionalsPage } from '@/pages/ProfessionalsPage';
import { AboutPage } from '@/pages/AboutPage';
import { CatalogsPage } from '@/pages/CatalogsPage';
import { ContactPage } from '@/pages/ContactPage';
import { RequestQuotePage } from '@/pages/RequestQuotePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SimulatorPage } from '@/pages/SimulatorPage';
import { CementTilesPage } from '@/pages/CementTilesPage';
import { FormatsPage } from '@/pages/FormatsPage';
import { BjmatPage } from '@/pages/BjmatPage';
import { BjmatLayoutsPage } from '@/pages/BjmatLayoutsPage';
import { AdminImportPage, AdminColorsPage, AdminPatternsPage, AdminMouldsPage } from '@/pages/admin/AdminPages';
import { AdminMouldReviewPage } from '@/pages/admin/AdminMouldReviewPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={`/${DEFAULT_LANGUAGE}`} replace /> },
  { path: '/admin/import/catalog', element: <AdminImportPage /> },
  { path: '/admin/catalog/colors', element: <AdminColorsPage /> },
  { path: '/admin/patterns', element: <AdminPatternsPage /> },
  { path: '/admin/cement-moulds', element: <AdminMouldsPage /> },
  { path: '/admin/mould-review', element: <AdminMouldReviewPage /> },
  {
    path: '/:lang',
    element: <LangLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'collections/:slug', element: <CollectionDetailPage /> },
      { path: 'colors', element: <ColorsPage source="UNICOLOR" /> },
      { path: 'colors/:slug', element: <ColorDetailPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'craftsmanship', element: <CraftsmanshipPage /> },
      { path: 'our-craft', element: <OurCraftPage /> },
      { path: 'professionals', element: <ProfessionalsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'catalogs', element: <CatalogsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'request-quote', element: <RequestQuotePage /> },
      { path: 'simulator', element: <SimulatorPage /> },
      { path: 'cement-tiles', element: <CementTilesPage /> },
      { path: 'cement-tiles/patterns', element: <ProductsPage /> },
      { path: 'cement-tiles/colors', element: <ColorsPage material="CementTile" titleKey="colors.cementTitle" subtitleKey="colors.cementSubtitle" path="/cement-tiles/colors" /> },
      { path: 'cement-tiles/formats', element: <FormatsPage material="CementTile" titleKey="formatsPage.cementTitle" path="/cement-tiles/formats" /> },
      { path: 'cement-tiles/simulator', element: <SimulatorPage /> },
      { path: 'formats', element: <FormatsPage /> },
      { path: 'zellige/colors', element: <ColorsPage material="Zellige" titleKey="colors.zelligeTitle" subtitleKey="colors.zelligeSubtitle" path="/zellige/colors" /> },
      { path: 'zellige/formats', element: <FormatsPage material="Zellige" titleKey="formatsPage.zelligeTitle" path="/zellige/formats" /> },
      { path: 'bjmat', element: <BjmatPage /> },
      { path: 'bjmat/colors', element: <ColorsPage material="Bejmat" titleKey="colors.bjmatTitle" subtitleKey="colors.bjmatSubtitle" path="/bjmat/colors" /> },
      { path: 'bjmat/formats', element: <FormatsPage material="Bejmat" titleKey="formatsPage.bjmatTitle" path="/bjmat/formats" /> },
      { path: 'bjmat/layouts', element: <BjmatLayoutsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <Navigate to={`/${DEFAULT_LANGUAGE}`} replace /> },
]);
